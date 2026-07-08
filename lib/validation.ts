import { getPool } from "./db";
import type { Grade } from "./types";

/**
 * Validation statistics computed from the rated universe — the empirical
 * backbone of the whitepaper. All figures derive from stored month-end score
 * timelines of real wallets; sample size is disclosed everywhere.
 *
 *  - Transition matrix: grade six months ago vs grade today (the classic
 *    rating-agency stability exhibit).
 *  - Activity persistence: share of wallets whose score moved in the
 *    trailing quarter, by baseline grade — higher grades should persist.
 */

interface HistoryPoint {
  month: string;
  score: number;
  grade: Grade;
  delta: number | null;
}

export interface ValidationStats {
  n: number; // rated wallets with sufficient history
  nTotal: number; // all rated wallets
  asOfMonth: string;
  baselineMonth: string;
  transition: Record<Grade, Record<Grade, number>>; // from -> to counts
  persistence: { grade: Grade; total: number; activePct: number }[];
  medianScore: number | null;
}

export async function validationStats(): Promise<ValidationStats | null> {
  const p = getPool();
  if (!p) return null;
  const { rows } = await p.query(
    `SELECT history FROM ratings WHERE history IS NOT NULL AND jsonb_array_length(history) >= 2 LIMIT 10000`,
  );
  const total = await p.query(`SELECT count(*)::int AS n, percentile_disc(0.5) WITHIN GROUP (ORDER BY score)::int AS median FROM ratings`);

  const now = new Date();
  const asOfMonth = now.toISOString().slice(0, 7);
  const baseline = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 6, 1));
  const baselineMonth = baseline.toISOString().slice(0, 7);

  const transition: Record<Grade, Record<Grade, number>> = {
    A: { A: 0, B: 0, C: 0 },
    B: { A: 0, B: 0, C: 0 },
    C: { A: 0, B: 0, C: 0 },
  };
  const persistenceAgg: Record<Grade, { total: number; active: number }> = {
    A: { total: 0, active: 0 },
    B: { total: 0, active: 0 },
    C: { total: 0, active: 0 },
  };
  let n = 0;

  for (const row of rows as { history: HistoryPoint[] }[]) {
    const h = row.history;
    if (!Array.isArray(h) || h.length < 2) continue;
    // Baseline: latest snapshot at or before the 6-months-ago mark.
    const base = [...h].reverse().find((pt) => pt.month <= baselineMonth);
    const latest = h[h.length - 1];
    if (!base || !latest || base.month === latest.month) continue;
    n++;
    transition[base.grade][latest.grade]++;
    // Active = score moved at least once in the trailing 3 snapshots.
    const trailing = h.slice(-3);
    const active = trailing.some((pt) => (pt.delta ?? 0) !== 0);
    persistenceAgg[base.grade].total++;
    if (active) persistenceAgg[base.grade].active++;
  }

  return {
    n,
    nTotal: total.rows[0].n,
    asOfMonth,
    baselineMonth,
    transition,
    persistence: (["A", "B", "C"] as Grade[]).map((g) => ({
      grade: g,
      total: persistenceAgg[g].total,
      activePct: persistenceAgg[g].total > 0 ? Math.round((persistenceAgg[g].active / persistenceAgg[g].total) * 100) : 0,
    })),
    medianScore: total.rows[0].median ?? null,
  };
}
