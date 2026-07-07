import { TOP_APPS } from "./apps";
import { hashSeed, heavyTail, mulberry32 } from "./prng";
import { scoreWallet } from "./scoring";
import type { AppActivity, ScoreResult, WalletProfile } from "./types";

/**
 * Demo data tier. In production this module is replaced by the indexer DB
 * (wallet <> app activity rows built from on-chain logs of the launch-app
 * contracts plus partner ingest via /api/v1/ingest). For the MVP, every
 * profile is derived deterministically from the address itself, so any
 * address resolves to a stable, realistic profile.
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

export function isEthAddress(input: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(input.trim());
}

export function buildProfile(address: string): WalletProfile {
  const addr = address.toLowerCase();
  const rand = mulberry32(hashSeed(addr));

  // Wallet-level traits drawn first so factors correlate realistically.
  const ageMonths = 2 + Math.floor(rand() * (MAX_AGE_MONTHS - 2));
  const wealth = rand(); // propensity for large tickets
  const activityLevel = rand(); // propensity for many transactions
  const breadthDraw = rand();
  // Breadth skews low: most wallets touch 1-2 apps, few touch all 5.
  const appsUsed = breadthDraw > 0.93 ? 5 : breadthDraw > 0.8 ? 4 : breadthDraw > 0.6 ? 3 : breadthDraw > 0.3 ? 2 : 1;

  // Pick which apps, deterministically.
  const shuffled = [...TOP_APPS].sort(
    (a, b) => hashSeed(addr + a.id) - hashSeed(addr + b.id),
  );
  const used = new Set(shuffled.slice(0, appsUsed).map((a) => a.id));

  const activities: AppActivity[] = TOP_APPS.map((app) => {
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
    activities,
    firstSeen: iso(monthsAgo(ageMonths)),
    activeMonths: Math.max(1, Math.round(ageMonths * activeShare)),
  };
}

export function lookupWallet(address: string): ScoreResult {
  return scoreWallet(buildProfile(address));
}

/** Deterministic pseudo-address for the seeded population and examples. */
function syntheticAddress(i: number): string {
  const r = mulberry32(hashSeed(`cookie-population-${i}`));
  let hex = "";
  while (hex.length < 40) hex += Math.floor(r() * 16).toString(16);
  return `0x${hex.slice(0, 40)}`;
}

// Indices verified to produce these archetypes under crumb-v0.1 calibration.
export const FEATURED_WALLETS: { label: string; address: string }[] = [
  { label: "Blue Chip", address: syntheticAddress(109) },
  { label: "Whale", address: syntheticAddress(2097) },
  { label: "Power User", address: syntheticAddress(604) },
  { label: "Tourist", address: syntheticAddress(1821) },
];

export interface NetworkStats {
  population: number;
  grades: { A: number; B: number; C: number };
  scoreHistogram: { bucket: string; count: number }[]; // 100-pt buckets
  totalVolumeUsd: number;
  totalTx: number;
  fullStackWallets: number;
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
  const perApp = new Map(TOP_APPS.map((a) => [a.id, { appId: a.id, wallets: 0, tx: 0, volumeUsd: 0 }]));
  let totalVolumeUsd = 0;
  let totalTx = 0;
  let fullStackWallets = 0;
  const scores: number[] = [];

  for (let i = 0; i < POPULATION; i++) {
    const profile = buildProfile(syntheticAddress(i));
    const r = scoreWallet(profile);
    grades[r.grade]++;
    hist[Math.min(9, Math.floor(r.score / 100))]++;
    totalVolumeUsd += r.totals.volumeUsd;
    totalTx += r.totals.txCount;
    if (r.totals.appsUsed === TOP_APPS.length) fullStackWallets++;
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
    perApp: [...perApp.values()],
    medianScore: scores[Math.floor(scores.length / 2)],
  };
  return cachedStats;
}
