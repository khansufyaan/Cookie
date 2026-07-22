/**
 * Parametric risk model — the analyst's levers.
 *
 * The console takes each monitored wallet's observed on-chain metrics
 * (transactions, volume, app breadth, ticket size, attestations, sanctions)
 * and recomputes a 0–1000 score entirely client-side from the lever settings,
 * so every slider move re-scores the whole portfolio instantly. The tool has
 * no opinion: risk bands are whatever thresholds the analyst sets.
 */

export interface WalletRow {
  address: string;
  txCount: number;
  volumeUsd: number;
  appsUsed: number;
  kycVerified: boolean;
  sanctioned: boolean;
  archetype: string | null;
  baselineScore: number; // score under the production model, from the DB
}

export interface Levers {
  // Factor weights (relative — normalized to their sum)
  wActivity: number; // transaction count
  wVolume: number; // lifetime USD volume
  wBreadth: number; // distinct tracked apps used
  wTicket: number; // average USD per transaction

  // Calibration ceilings — the value at which a factor saturates to 1.0
  activityCeil: number;
  volumeCeil: number;
  breadthSat: number;
  ticketCeil: number;

  // Temperature — strictness curve. 1 = linear; >1 punishes mid-range
  // wallets (strict); <1 rewards partial signal (lenient).
  temperature: number;

  // Bonuses
  kycBonus: number;
  fullStackThreshold: number;
  fullStackBonus: number;

  // Thin-file penalty — wallets with fewer than N transactions get docked
  thinFileTx: number;
  thinFilePenalty: number;

  // Sanctions policy
  sanctionsBlock: boolean; // hard-block (score 0, own band)
  sanctionsPenalty: number; // points docked when not hard-blocking

  // Risk bands — analyst-defined thresholds
  lowMin: number; // score >= lowMin  → Low risk
  elevatedMin: number; // score >= elevatedMin → Elevated, else High
}

/** Mirrors the production engine's calibration (vwr-v0.4). */
export const DEFAULT_LEVERS: Levers = {
  wActivity: 25,
  wVolume: 25,
  wBreadth: 20,
  wTicket: 15,
  activityCeil: 2500,
  volumeCeil: 5_000_000,
  breadthSat: 7,
  ticketCeil: 25_000,
  temperature: 1.0,
  kycBonus: 50,
  fullStackThreshold: 5,
  fullStackBonus: 50,
  thinFileTx: 0,
  thinFilePenalty: 0,
  sanctionsBlock: true,
  sanctionsPenalty: 500,
  lowMin: 700,
  elevatedMin: 400,
};

export const PRESETS: { name: string; note: string; levers: Levers }[] = [
  {
    name: "Production baseline",
    note: "Mirrors the live vwr-v0.4 engine calibration.",
    levers: { ...DEFAULT_LEVERS },
  },
  {
    name: "Conservative",
    note: "Strict curve, KYC weighted heavily, thin files penalized.",
    levers: {
      ...DEFAULT_LEVERS,
      temperature: 1.5,
      kycBonus: 120,
      thinFileTx: 10,
      thinFilePenalty: 120,
      lowMin: 780,
      elevatedMin: 500,
    },
  },
  {
    name: "Growth",
    note: "Lenient curve — favors breadth and early activity.",
    levers: {
      ...DEFAULT_LEVERS,
      temperature: 0.75,
      wBreadth: 30,
      wTicket: 10,
      lowMin: 600,
      elevatedMin: 300,
    },
  },
];

export type Band = "low" | "elevated" | "high" | "blocked";

export const BAND_META: Record<Band, { label: string; color: string }> = {
  low: { label: "Low risk", color: "var(--risk-low)" },
  elevated: { label: "Elevated", color: "var(--risk-elevated)" },
  high: { label: "High risk", color: "var(--risk-high)" },
  blocked: { label: "Sanctioned", color: "var(--risk-blocked)" },
};

function logCalib(value: number, ceiling: number): number {
  if (value <= 0 || ceiling <= 0) return 0;
  return Math.min(1, Math.log10(1 + value) / Math.log10(1 + ceiling));
}

export interface Scored {
  row: WalletRow;
  score: number;
  band: Band;
}

export function scoreRow(row: WalletRow, L: Levers): Scored {
  if (row.sanctioned && L.sanctionsBlock) {
    return { row, score: 0, band: "blocked" };
  }

  const avgTicket = row.txCount > 0 ? row.volumeUsd / row.txCount : 0;
  const t = L.temperature;

  const activity = Math.pow(logCalib(row.txCount, L.activityCeil), t);
  const volume = Math.pow(logCalib(row.volumeUsd, L.volumeCeil), t);
  const breadth = Math.pow(Math.min(1, row.appsUsed / Math.max(1, L.breadthSat)), t);
  const ticket = Math.pow(logCalib(avgTicket, L.ticketCeil), t);

  const wSum = Math.max(1, L.wActivity + L.wVolume + L.wBreadth + L.wTicket);
  let score =
    ((activity * L.wActivity + volume * L.wVolume + breadth * L.wBreadth + ticket * L.wTicket) / wSum) * 1000;

  if (row.appsUsed >= L.fullStackThreshold) score += L.fullStackBonus;
  if (row.kycVerified) score += L.kycBonus;
  if (L.thinFileTx > 0 && row.txCount < L.thinFileTx) score -= L.thinFilePenalty;
  if (row.sanctioned && !L.sanctionsBlock) score -= L.sanctionsPenalty;

  score = Math.max(0, Math.min(1000, Math.round(score)));

  const band: Band = score >= L.lowMin ? "low" : score >= L.elevatedMin ? "elevated" : "high";
  return { row, score, band };
}

export function scorePortfolio(rows: WalletRow[], L: Levers): Scored[] {
  return rows.map((r) => scoreRow(r, L));
}

/** Summary stats for the dashboard. */
export interface PortfolioSummary {
  total: number;
  bands: Record<Band, number>;
  medianScore: number;
  meanScore: number;
  totalVolumeUsd: number;
  kycShare: number;
  sanctionedCount: number;
  histogram: { bucket: number; counts: Record<Band, number> }[]; // 20 buckets of 50
}

export function summarize(scored: Scored[]): PortfolioSummary {
  const bands: Record<Band, number> = { low: 0, elevated: 0, high: 0, blocked: 0 };
  const histogram = Array.from({ length: 20 }, (_, i) => ({
    bucket: i * 50,
    counts: { low: 0, elevated: 0, high: 0, blocked: 0 } as Record<Band, number>,
  }));
  let volume = 0;
  let kyc = 0;
  let sanctioned = 0;
  const scores: number[] = [];

  for (const s of scored) {
    bands[s.band]++;
    scores.push(s.score);
    volume += s.row.volumeUsd;
    if (s.row.kycVerified) kyc++;
    if (s.row.sanctioned) sanctioned++;
    const b = Math.min(19, Math.floor(s.score / 50));
    histogram[b].counts[s.band]++;
  }

  scores.sort((a, b) => a - b);
  const median = scores.length ? scores[Math.floor(scores.length / 2)] : 0;
  const mean = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return {
    total: scored.length,
    bands,
    medianScore: median,
    meanScore: mean,
    totalVolumeUsd: volume,
    kycShare: scored.length ? kyc / scored.length : 0,
    sanctionedCount: sanctioned,
    histogram,
  };
}

/** How many wallets changed band vs a reference scoring. */
export function bandMovement(current: Scored[], reference: Scored[]): { moved: number; up: number; down: number } {
  const order: Record<Band, number> = { blocked: 0, high: 1, elevated: 2, low: 3 };
  const ref = new Map(reference.map((s) => [s.row.address, s.band]));
  let up = 0;
  let down = 0;
  for (const s of current) {
    const r = ref.get(s.row.address);
    if (!r || r === s.band) continue;
    if (order[s.band] > order[r]) up++;
    else down++;
  }
  return { moved: up + down, up, down };
}

/** Per-wallet factor breakdown under a given lever setting — the drill-down. */
export interface Explanation {
  score: number;
  band: Band;
  factors: { key: string; label: string; raw: number; points: number; detail: string }[];
  adjustments: { label: string; points: number }[];
}

export function explainRow(row: WalletRow, L: Levers): Explanation {
  const scored = scoreRow(row, L);
  const avgTicket = row.txCount > 0 ? row.volumeUsd / row.txCount : 0;
  const t = L.temperature;
  const wSum = Math.max(1, L.wActivity + L.wVolume + L.wBreadth + L.wTicket);

  const activity = Math.pow(logCalib(row.txCount, L.activityCeil), t);
  const volume = Math.pow(logCalib(row.volumeUsd, L.volumeCeil), t);
  const breadth = Math.pow(Math.min(1, row.appsUsed / Math.max(1, L.breadthSat)), t);
  const ticket = Math.pow(logCalib(avgTicket, L.ticketCeil), t);

  const factors = [
    { key: "activity", label: "Activity", raw: activity, points: Math.round((activity * L.wActivity / wSum) * 1000), detail: `${row.txCount.toLocaleString()} transactions` },
    { key: "volume", label: "Volume", raw: volume, points: Math.round((volume * L.wVolume / wSum) * 1000), detail: `$${Math.round(row.volumeUsd).toLocaleString()} lifetime` },
    { key: "breadth", label: "Breadth", raw: breadth, points: Math.round((breadth * L.wBreadth / wSum) * 1000), detail: `${row.appsUsed} tracked apps` },
    { key: "ticket", label: "Ticket size", raw: ticket, points: Math.round((ticket * L.wTicket / wSum) * 1000), detail: `$${Math.round(avgTicket).toLocaleString()} avg per tx` },
  ];

  const adjustments: { label: string; points: number }[] = [];
  if (row.appsUsed >= L.fullStackThreshold) adjustments.push({ label: `Full-stack (${row.appsUsed} ≥ ${L.fullStackThreshold} apps)`, points: L.fullStackBonus });
  if (row.kycVerified) adjustments.push({ label: "KYC attestation", points: L.kycBonus });
  if (L.thinFileTx > 0 && row.txCount < L.thinFileTx) adjustments.push({ label: `Thin file (< ${L.thinFileTx} txs)`, points: -L.thinFilePenalty });
  if (row.sanctioned) adjustments.push({ label: L.sanctionsBlock ? "Sanctions hard-block" : "Sanctions penalty", points: L.sanctionsBlock ? -1000 : -L.sanctionsPenalty });

  return { score: scored.score, band: scored.band, factors, adjustments };
}
