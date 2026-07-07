import { NextResponse } from "next/server";
import { isEthAddress, lookupWallet } from "@/lib/wallets";

/**
 * GET /api/v1/score/:address — the marketplace read side.
 * Partner apps call this to retrieve a wallet's Cookie rating.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;
  if (!isEthAddress(address)) {
    return NextResponse.json(
      { error: "Invalid address. Expected a 0x-prefixed 40-hex-char EVM address." },
      { status: 400 },
    );
  }
  const result = lookupWallet(address);
  return NextResponse.json({
    data: result,
    meta: {
      engine: "crumb-v0.1",
      tier: "demo",
      note: "MVP demo tier: profiles are synthesized deterministically from the address. Production tier serves indexed on-chain + partner-ingested data.",
    },
  });
}
