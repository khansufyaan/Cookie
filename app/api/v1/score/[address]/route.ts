import { NextResponse } from "next/server";
import { resolveWallet } from "@/lib/wallets";

/**
 * GET /api/v1/score/:address — the marketplace read side.
 * Partner apps call this to retrieve a wallet's Cookie rating.
 * EVM addresses are served from live Ethereum mainnet data; Solana addresses
 * are demo tier until the Solana indexer is connected.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;
  const report = await resolveWallet(address);
  if (!report) {
    return NextResponse.json(
      { error: "Invalid address. Expected an EVM (0x…) or Solana (base58) address." },
      { status: 400 },
    );
  }
  return NextResponse.json({
    data: report.result,
    meta: {
      engine: "crumb-v0.2",
      dataSource: report.dataSource,
      note: report.liveNote,
    },
  });
}
