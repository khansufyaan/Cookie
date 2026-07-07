import { NextResponse } from "next/server";
import { liveCoverageNote, resolveWallet } from "@/lib/wallets";

/**
 * GET /api/v1/score/:address — the marketplace read side.
 * EVM addresses are served from live Ethereum mainnet data (full history via
 * Alchemy when configured), including the monthly score timeline. No
 * synthetic data: Solana returns 501 until its indexer lands.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;
  const resolution = await resolveWallet(address);

  switch (resolution.kind) {
    case "invalid":
      return NextResponse.json(
        { error: "Invalid address. Expected an EVM (0x…) or Solana (base58) address." },
        { status: 400 },
      );
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
          engine: "halbrook-v0.3",
          dataSource: "live",
          chainSource: report.source,
          note: liveCoverageNote(report),
        },
      });
    }
  }
}
