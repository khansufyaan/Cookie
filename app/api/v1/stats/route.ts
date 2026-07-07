import { NextResponse } from "next/server";
import { APP_BY_ID } from "@/lib/apps";
import { fetchContractCounters } from "@/lib/counters";

export const revalidate = 3600;

/** GET /api/v1/stats — live per-contract activity totals (no synthetic data). */
export async function GET() {
  const counters = await fetchContractCounters();
  return NextResponse.json({
    data: {
      totalTx: counters.reduce((s, c) => s + (c.txCount ?? 0), 0),
      contracts: counters.map((c) => ({
        appId: c.appId,
        app: APP_BY_ID.get(c.appId)?.name,
        chain: APP_BY_ID.get(c.appId)?.chain,
        contract: c.contract,
        txCount: c.txCount,
        note: c.note,
      })),
    },
    meta: { engine: "halbrook-v0.3", dataSource: "live", refreshed: "hourly" },
  });
}
