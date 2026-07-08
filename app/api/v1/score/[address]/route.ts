import { NextResponse } from "next/server";
import { meter } from "@/lib/apikeys";
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
      return NextResponse.json({
        data: { ...report.result, history: report.history },
        meta: {
          engine: "vwr-v0.4",
          dataSource: "live",
          chainSource: report.source,
          note: liveCoverageNote(report),
        },
      });
    }
  }
}
