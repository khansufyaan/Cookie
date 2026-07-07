import { appsForFamily, EVM_APPS } from "./apps";
import { fetchLiveEvmProfile, checkKycAttestation } from "./live";
import { isOfacSanctioned, OFAC_ENTRY_COUNT, OFAC_LIST_NAME } from "./ofac";
import { hashSeed, heavyTail, mulberry32 } from "./prng";
import { scoreWallet, type ScoreSignals } from "./scoring";
import type { AppActivity, ChainFamily, DataSource, ScoreResult, WalletProfile } from "./types";

/**
 * Wallet resolution. Two tiers:
 *  - live: real Ethereum mainnet history (Blockscout) + real KYC attestation
 *    check (EAS on Base) + real OFAC snapshot screening.
 *  - demo: profile synthesized deterministically from the address (same
 *    address -> same report). Used for Solana (indexer not connected yet)
 *    and as fallback when the chain API is unreachable. OFAC screening is
 *    always real, even for demo profiles.
 */

// Anchor "now" for demo data generation so dates are stable within a build.
const NOW = new Date("2026-07-01T00:00:00Z");
const MAX_AGE_MONTHS = 72;

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthsAgo(months: number): Date {
  const d = new Date(NOW);
  d.setMonth(d.getMonth() - months);
  return d;
}

export function isEvmAddress(input: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(input.trim());
}

export function isSolanaAddress(input: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input.trim());
}

export function detectFamily(input: string): ChainFamily | null {
  if (isEvmAddress(input)) return "evm";
  if (isSolanaAddress(input)) return "solana";
  return null;
}

export function buildDemoProfile(address: string, family: ChainFamily): WalletProfile {
  const addr = family === "evm" ? address.toLowerCase() : address;
  const rand = mulberry32(hashSeed(addr));
  const apps = appsForFamily(family);

  // Wallet-level traits drawn first so factors correlate realistically.
  const ageMonths = 2 + Math.floor(rand() * (MAX_AGE_MONTHS - 2));
  const wealth = rand(); // propensity for large tickets
  const activityLevel = rand(); // propensity for many transactions
  const breadthDraw = rand();
  // Breadth skews low: most wallets touch 1-3 of the 10 tracked apps.
  const appsUsed =
    breadthDraw > 0.97 ? 7 : breadthDraw > 0.92 ? 6 : breadthDraw > 0.84 ? 5 : breadthDraw > 0.72 ? 4 : breadthDraw > 0.52 ? 3 : breadthDraw > 0.26 ? 2 : 1;

  const shuffled = [...apps].sort((a, b) => hashSeed(addr + a.id) - hashSeed(addr + b.id));
  const used = new Set(shuffled.slice(0, appsUsed).map((a) => a.id));

  const activities: AppActivity[] = apps.map((app) => {
    if (!used.has(app.id)) {
      return { appId: app.id, txCount: 0, volumeUsd: 0, firstTx: "", lastTx: "" };
    }
    const txCount = Math.max(1, Math.round(heavyTail((activityLevel + rand()) / 2, 1200, 5)));
    const avgTicket = 10 + heavyTail((wealth + rand()) / 2, 40_000, 5);
    const firstTxMonths = Math.max(1, Math.floor(ageMonths * (0.5 + rand() * 0.5)));
    const lastTxMonths = Math.floor(rand() * Math.min(6, firstTxMonths));
    return {
      appId: app.id,
      txCount,
      volumeUsd: Math.round(txCount * avgTicket),
      firstTx: iso(monthsAgo(firstTxMonths)),
      lastTx: iso(monthsAgo(lastTxMonths)),
    };
  });

  const activeShare = 0.15 + 0.85 * ((activityLevel + rand()) / 2);
  return {
    address: addr,
    family,
    activities,
    firstSeen: iso(monthsAgo(ageMonths)),
    activeMonths: Math.max(1, Math.round(ageMonths * activeShare)),
  };
}

function demoKycFlag(address: string): boolean {
  // ~18% of demo wallets carry a synthetic KYC attestation.
  return hashSeed(`kyc:${address.toLowerCase()}`) % 100 < 18;
}

function baseSignals(address: string): Pick<ScoreSignals, "sanctioned" | "sanctionsList" | "sanctionsEntryCount"> {
  return {
    sanctioned: isOfacSanctioned(address),
    sanctionsList: OFAC_LIST_NAME,
    sanctionsEntryCount: OFAC_ENTRY_COUNT,
  };
}

export interface WalletReport {
  result: ScoreResult;
  profile: WalletProfile;
  dataSource: DataSource;
  liveNote: string;
}

/** Full resolution: live chain data where available, demo elsewhere. */
export async function resolveWallet(
  address: string,
  opts: { forceDemo?: boolean } = {},
): Promise<WalletReport | null> {
  const family = detectFamily(address);
  if (!family) return null;

  if (opts.forceDemo) {
    const profile = buildDemoProfile(address, family);
    const result = scoreWallet(profile, {
      kycVerified: demoKycFlag(address),
      kycSource: "Demo tier — synthetic attestation flag",
      ...baseSignals(address),
    });
    return {
      result,
      profile,
      dataSource: "demo",
      liveNote: "Synthetic example profile — not real chain history.",
    };
  }

  if (family === "evm") {
    const [live, kyc] = await Promise.all([
      fetchLiveEvmProfile(address),
      checkKycAttestation(address),
    ]);
    if (live) {
      const result = scoreWallet(live.profile, {
        kycVerified: kyc.verified,
        kycSource: kyc.source,
        ...baseSignals(address),
      });
      return {
        result,
        profile: live.profile,
        dataSource: "live",
        liveNote: live.windowCapped
          ? `Live Ethereum data — scanned your ${live.scannedTx} most recent transactions (history window capped; older activity not yet included). Token-only transfers count toward Usage but not yet Magnitude. Polygon apps (Polymarket) not yet indexed.`
          : `Live Ethereum data — scanned all ${live.scannedTx} outgoing transactions. Token-only transfers count toward Usage but not yet Magnitude. Polygon apps (Polymarket) not yet indexed.`,
      };
    }
    // Chain API unreachable: honest failure, demo fallback.
    const profile = buildDemoProfile(address, family);
    const result = scoreWallet(profile, {
      kycVerified: demoKycFlag(address),
      kycSource: "Demo tier — synthetic attestation flag",
      ...baseSignals(address),
    });
    return {
      result,
      profile,
      dataSource: "demo",
      liveNote: "Chain API unreachable — showing a synthesized demo profile, NOT your real history.",
    };
  }

  // Solana: indexer not connected yet -> demo tier.
  const profile = buildDemoProfile(address, family);
  const result = scoreWallet(profile, {
    kycVerified: demoKycFlag(address),
    kycSource: "Demo tier — synthetic attestation flag",
    ...baseSignals(address),
  });
  return {
    result,
    profile,
    dataSource: "demo",
    liveNote: "Solana indexer not connected yet — this is a synthesized demo profile, NOT real history.",
  };
}

/** Synchronous demo-only rating (used by network stats and ingest). */
export function demoRate(address: string, family: ChainFamily): ScoreResult {
  const profile = buildDemoProfile(address, family);
  return scoreWallet(profile, {
    kycVerified: demoKycFlag(address),
    kycSource: "Demo tier — synthetic attestation flag",
    ...baseSignals(address),
  });
}

/** Deterministic pseudo-address for the seeded population and examples. */
function syntheticAddress(i: number): string {
  const r = mulberry32(hashSeed(`cookie-population-${i}`));
  let hex = "";
  while (hex.length < 40) hex += Math.floor(r() * 16).toString(16);
  return `0x${hex.slice(0, 40)}`;
}

// Indices verified to produce these archetypes under crumb-v0.2 calibration.
export const FEATURED_WALLETS: { label: string; address: string }[] = [
  { label: "Blue Chip", address: syntheticAddress(320) },
  { label: "Whale", address: syntheticAddress(2034) },
  { label: "Power User", address: syntheticAddress(1831) },
  { label: "Tourist", address: syntheticAddress(506) },
];

export interface NetworkStats {
  population: number;
  grades: { A: number; B: number; C: number };
  scoreHistogram: { bucket: string; count: number }[]; // 100-pt buckets
  totalVolumeUsd: number;
  totalTx: number;
  fullStackWallets: number;
  kycWallets: number;
  perApp: { appId: string; wallets: number; tx: number; volumeUsd: number }[];
  medianScore: number;
}

const POPULATION = 2500;
let cachedStats: NetworkStats | null = null;

/** Aggregate stats over the seeded demo population (computed once per server). */
export function networkStats(): NetworkStats {
  if (cachedStats) return cachedStats;
  const grades = { A: 0, B: 0, C: 0 };
  const hist = new Array(10).fill(0);
  const perApp = new Map(
    [...EVM_APPS, ...appsForFamily("solana")].map((a) => [
      a.id,
      { appId: a.id, wallets: 0, tx: 0, volumeUsd: 0 },
    ]),
  );
  let totalVolumeUsd = 0;
  let totalTx = 0;
  let fullStackWallets = 0;
  let kycWallets = 0;
  const scores: number[] = [];

  for (let i = 0; i < POPULATION; i++) {
    // 70% EVM / 30% Solana demo population mix.
    const family: ChainFamily = i % 10 < 7 ? "evm" : "solana";
    const addr = syntheticAddress(i);
    const profile = buildDemoProfile(addr, family);
    const r = scoreWallet(profile, {
      kycVerified: demoKycFlag(addr),
      kycSource: "demo",
      sanctioned: false,
      sanctionsList: OFAC_LIST_NAME,
      sanctionsEntryCount: OFAC_ENTRY_COUNT,
    });
    grades[r.grade]++;
    hist[Math.min(9, Math.floor(r.score / 100))]++;
    totalVolumeUsd += r.totals.volumeUsd;
    totalTx += r.totals.txCount;
    if (r.fullStackBonus > 0) fullStackWallets++;
    if (r.kyc.verified) kycWallets++;
    scores.push(r.score);
    for (const a of profile.activities) {
      if (a.txCount === 0) continue;
      const agg = perApp.get(a.appId)!;
      agg.wallets++;
      agg.tx += a.txCount;
      agg.volumeUsd += a.volumeUsd;
    }
  }

  scores.sort((a, b) => a - b);
  cachedStats = {
    population: POPULATION,
    grades,
    scoreHistogram: hist.map((count, i) => ({ bucket: `${i * 100}`, count })),
    totalVolumeUsd,
    totalTx,
    fullStackWallets,
    kycWallets,
    perApp: [...perApp.values()],
    medianScore: scores[Math.floor(scores.length / 2)],
  };
  return cachedStats;
}
