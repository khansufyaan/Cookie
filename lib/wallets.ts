import { buildProfileFromMatched, checkKycAttestation, fetchLiveEvmLookup, fetchLiveSolLookup } from "./live";
import { isOfacSanctioned, OFAC_ENTRY_COUNT, OFAC_LIST_NAME } from "./ofac";
import { scoreWallet } from "./scoring";
import type { ChainFamily, Grade, ScoreResult, WalletProfile } from "./types";
import type { MatchedTx } from "./live";

/**
 * Wallet resolution — live data only, no synthetic profiles.
 *  - EVM: full history via Alchemy (Blockscout fallback), OFAC snapshot
 *    screening, KYC attestation check, and a monthly score timeline.
 *  - Solana: not yet indexed; surfaced as coming-soon, never faked.
 */

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

export interface MonthlyScore {
  month: string; // YYYY-MM
  score: number;
  grade: Grade;
  delta: number | null; // vs previous month; null for the first point
}

export interface WalletReport {
  result: ScoreResult;
  profile: WalletProfile;
  history: MonthlyScore[]; // last 12 month-end snapshots (first active month onward)
  scannedTx: number;
  windowCapped: boolean;
  source: "alchemy" | "blockscout" | "helius";
}

export type Resolution =
  | { kind: "ok"; report: WalletReport }
  | { kind: "invalid" }
  | { kind: "solana-soon" }
  | { kind: "unavailable" };

function lastMonthEnds(count: number, now = new Date()): { month: string; endDate: string; asOf: Date }[] {
  const out = [];
  for (let i = count - 1; i >= 0; i--) {
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 0, 23, 59, 59));
    out.push({
      month: end.toISOString().slice(0, 7),
      endDate: end.toISOString().slice(0, 10),
      asOf: end,
    });
  }
  return out;
}

function buildHistory(
  address: string,
  matched: MatchedTx[],
  signals: Parameters<typeof scoreWallet>[1],
  family: ChainFamily,
): MonthlyScore[] {
  if (matched.length === 0) return [];
  const points = lastMonthEnds(12)
    .map(({ month, endDate, asOf }) => {
      const snapshot = buildProfileFromMatched(address, matched, endDate, family);
      if (snapshot.activities.length === 0) return null; // wallet not active yet
      const r = scoreWallet(snapshot, signals, { asOf });
      return { month, score: r.score, grade: r.grade };
    })
    .filter((p): p is { month: string; score: number; grade: Grade } => p !== null);
  return points.map((p, i) => ({
    ...p,
    delta: i === 0 ? null : p.score - points[i - 1].score,
  }));
}

export async function resolveWallet(address: string): Promise<Resolution> {
  const family = detectFamily(address);
  if (!family) return { kind: "invalid" };

  let live, kyc;
  if (family === "solana") {
    if (!process.env.HELIUS_API_KEY) return { kind: "solana-soon" };
    live = await fetchLiveSolLookup(address);
    kyc = { verified: false, source: "KYC attestation checks are not yet available on Solana" };
  } else {
    [live, kyc] = await Promise.all([fetchLiveEvmLookup(address), checkKycAttestation(address)]);
  }
  if (!live) return { kind: "unavailable" };

  const signals = {
    kycVerified: kyc.verified,
    kycSource: kyc.source,
    sanctioned: isOfacSanctioned(address),
    sanctionsList: OFAC_LIST_NAME,
    sanctionsEntryCount: OFAC_ENTRY_COUNT,
  };
  const result = scoreWallet(live.profile, signals);
  const history = signals.sanctioned ? [] : buildHistory(address, live.matched, signals, family);

  return {
    kind: "ok",
    report: {
      result,
      profile: live.profile,
      history,
      scannedTx: live.scannedTx,
      windowCapped: live.windowCapped,
      source: live.source,
    },
  };
}

export function liveCoverageNote(report: WalletReport): string {
  if (report.source === "helius") {
    const base = report.windowCapped
      ? `Recent-history scan via Helius, capped at ${report.scannedTx.toLocaleString()} transactions — very active wallet, older activity may be excluded.`
      : `Full recent history scanned (${report.scannedTx.toLocaleString()} transactions, Helius).`;
    return `${base} SOL and major-stablecoin legs are valued in USD; other token volume counts toward Usage only.`;
  }
  const base =
    report.source === "alchemy"
      ? report.windowCapped
        ? `Full-history scan via Alchemy, capped at ${report.scannedTx.toLocaleString()} transfers — extremely active wallet, oldest activity may be excluded.`
        : `Full outgoing history scanned (${report.scannedTx.toLocaleString()} transfers, Alchemy).`
      : `Most recent ${report.scannedTx.toLocaleString()} transactions scanned (Blockscout fallback).`;
  return `${base} ETH and major-stablecoin legs are valued in USD; other token volume counts toward Usage only. Polygon (Polymarket) is not yet indexed.`;
}
