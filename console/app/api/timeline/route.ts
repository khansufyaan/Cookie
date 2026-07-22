import { NextResponse } from "next/server";
import { ensureConsoleTables, getPool } from "@/lib/db";
import { demoPortfolio } from "@/lib/demo";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export interface TimelineMonth {
  month: string; // YYYY-MM
  buckets: number[]; // 20 buckets of 50 score points
  total: number;
}

/**
 * GET /api/timeline?watchlist=<id|all> — monthly score distributions built
 * from each wallet's stored month-end history (production engine scores).
 * Bucketed at 50-point granularity so the client can apply ANY analyst band
 * thresholds to the past and watch cohorts migrate.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const watchlist = url.searchParams.get("watchlist") ?? "all";

  try {
    const p = getPool();
    if (!p) throw new Error("no database");
    await ensureConsoleTables();

    const params: unknown[] = [];
    let join = "";
    if (watchlist !== "all") {
      params.push(Number(watchlist));
      join = `JOIN console_watchlist_wallets cw ON cw.address = r.address AND cw.watchlist_id = $1`;
    }

    const { rows } = await p.query(
      `SELECT h->>'month' AS month,
              LEAST(19, GREATEST(0, floor((h->>'score')::numeric / 50)))::int AS bucket,
              COUNT(*)::int AS n
       FROM ratings r ${join}, jsonb_array_elements(r.history) h
       WHERE r.history IS NOT NULL AND jsonb_typeof(r.history) = 'array'
       GROUP BY 1, 2
       ORDER BY 1`,
      params,
    );

    const byMonth = new Map<string, number[]>();
    for (const r of rows) {
      if (!r.month) continue;
      if (!byMonth.has(r.month)) byMonth.set(r.month, Array(20).fill(0));
      byMonth.get(r.month)![r.bucket] += r.n;
    }
    const months: TimelineMonth[] = [...byMonth.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-12)
      .map(([month, buckets]) => ({ month, buckets, total: buckets.reduce((a, b) => a + b, 0) }));

    return NextResponse.json({ data: months, meta: { source: "live" } });
  } catch (err) {
    console.error("timeline query failed, serving demo:", err);
    // Synthetic drift: portfolio slowly improving over 12 months.
    const rowsD = demoPortfolio(1000);
    const months: TimelineMonth[] = [];
    const now = new Date("2026-07-01T00:00:00Z");
    for (let m = 11; m >= 0; m--) {
      const d = new Date(now);
      d.setUTCMonth(d.getUTCMonth() - m);
      const label = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const buckets = Array(20).fill(0);
      const drift = (11 - m) * 14;
      for (const r of rowsD) {
        const s = Math.max(0, Math.min(999, Math.round(r.txCount * 2 + Math.log10(1 + r.volumeUsd) * 55 - 160 + drift)));
        buckets[Math.floor(s / 50)]++;
      }
      months.push({ month: label, buckets, total: rowsD.length });
    }
    return NextResponse.json({ data: months, meta: { source: "demo" } });
  }
}
