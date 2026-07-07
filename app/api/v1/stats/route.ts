import { NextResponse } from "next/server";
import { networkStats } from "@/lib/wallets";

/** GET /api/v1/stats — aggregate network statistics. */
export async function GET() {
  return NextResponse.json({
    data: networkStats(),
    meta: { engine: "crumb-v0.1", tier: "demo" },
  });
}
