import { NextResponse } from "next/server";
import { meter } from "@/lib/apikeys";
import { APP_BY_ID } from "@/lib/apps";
import { liveCoverageNote, resolveWallet } from "@/lib/wallets";

export const maxDuration = 60;

/**
 * GET /api/v1/score/:address — the marketplace read side.
 * EVM addresses are served from live Ethereum mainnet data (full history via
 * Alchemy when configured), including the monthly score timeline. No
 * synthetic data: Solana returns 501 until its indexer lands.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const usage = await meter(req);
  if (!usage.allowed) {
    return NextResponse.json(
      usage.tier === "invalid"
        ? { error: "Invalid API key." }
        : {
            error: `Daily limit reached (${usage.limit}/day on the ${usage.tier} tier). Get a free key at /pricing for 1,000/day.`,
            tier: usage.tier,
            used: usage.used,
            limit: usage.limit,
          },
      { status: usage.tier === "invalid" ? 401 : 429 },
    );
  }

  const { address } = await params;
  const resolution = await resolveWallet(address);

  switch (resolution.kind) {
    case "invalid":
      return NextResponse.json(
        { error: "Invalid address. Expected an EVM (0x…) or Solana (base58) address." },
        { status: 400 },
      );
    case "custodial":
      return NextResponse.json({
        data: { entityType: "custodial_pool", label: resolution.label, grade: null },
        meta: {
          engine: "vwr-v0.4",
          note: "Known custodial/omnibus address — transfers from it carry no wallet-level signal about the end user. No grade is issued.",
        },
      });
    case "solana-soon":
      return NextResponse.json(
        { error: "Solana coverage is in progress. No synthetic scores are served." },
        { status: 501 },
      );
    case "unavailable":
      return NextResponse.json(
        { error: "Chain data source temporarily unreachable. Try again shortly." },
        { status: 503 },
      );
    case "ok": {
      const { report } = resolution;
      const { result } = report;

      const apps = report.profile.activities
        .filter((a) => a.txCount > 0)
        .sort((a, b) => b.txCount - a.txCount)
        .map((a) => ({
          id: a.appId,
          name: APP_BY_ID.get(a.appId)?.name ?? a.appId,
          txCount: a.txCount,
          volumeUsd: Math.round(a.volumeUsd),
          firstTx: a.firstTx,
          lastTx: a.lastTx,
        }));

      const stableTotal = report.stableMix.reduce((t, s) => t + s.usd, 0);
      const stablecoins = report.stableMix
        .filter((s) => s.usd >= 1)
        .sort((a, b) => b.usd - a.usd)
        .map((s) => ({
          asset: s.asset,
          volumeUsd: Math.round(s.usd),
          share: stableTotal > 0 ? Number((s.usd / stableTotal).toFixed(3)) : 0,
        }));

      const averageTransactionUsd =
        result.totals.txCount > 0 ? Math.round(result.totals.volumeUsd / result.totals.txCount) : 0;

      return NextResponse.json({
        data: { ...result, averageTransactionUsd, apps, stablecoins, history: report.history },
        meta: {
          engine: "vwr-v0.4",
          dataSource: "live",
          note: liveCoverageNote(report),
        },
      });
    }
  }
}
