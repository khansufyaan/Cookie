import { NextResponse } from "next/server";
import { ensureConsoleTables, getPool } from "@/lib/db";
import { demoPortfolio } from "@/lib/demo";
import { DEFAULT_LEVERS, scoreRow, type WalletRow } from "@/lib/model";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/portfolio?watchlist=<id|all>&limit=<n>
 * Returns the monitored wallet rows (observed metrics only — scoring happens
 * client-side from the analyst's levers). Falls back to a clearly-flagged
 * synthetic portfolio when the database is unreachable.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const watchlist = url.searchParams.get("watchlist") ?? "all";
  const limit = Math.min(5000, Math.max(100, Number(url.searchParams.get("limit")) || 2000));

  try {
    const p = getPool();
    if (!p) throw new Error("no database configured");
    await ensureConsoleTables();

    const params: unknown[] = [];
    let join = "";
    if (watchlist !== "all") {
      params.push(Number(watchlist));
      join = `JOIN console_watchlist_wallets cw ON cw.address = r.address AND cw.watchlist_id = $1`;
    }
    params.push(limit);

    const { rows } = await p.query(
      `SELECT r.address, r.score, r.tx_count, r.volume_usd, r.apps_used,
              r.kyc_verified, r.sanctioned, r.archetype
       FROM ratings r ${join}
       ORDER BY r.volume_usd DESC
       LIMIT $${params.length}`,
      params,
    );

    const data: WalletRow[] = rows.map((r) => ({
      address: r.address,
      txCount: Number(r.tx_count),
      volumeUsd: Number(r.volume_usd),
      appsUsed: Number(r.apps_used),
      kycVerified: Boolean(r.kyc_verified),
      sanctioned: Boolean(r.sanctioned),
      archetype: r.archetype,
      baselineScore: Number(r.score),
    }));

    return NextResponse.json({ data, meta: { source: "live", count: data.length } });
  } catch (err) {
    console.error("portfolio query failed, serving demo data:", err);
    const data = demoPortfolio(1000).map((r) => ({
      ...r,
      baselineScore: scoreRow(r, DEFAULT_LEVERS).score,
    }));
    return NextResponse.json({ data, meta: { source: "demo", count: data.length } });
  }
}
