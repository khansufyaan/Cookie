import { NextResponse } from "next/server";
import { APP_BY_ID } from "@/lib/apps";
import { fetchContractCounters } from "@/lib/counters";
import { universeStats } from "@/lib/indexer";

export const revalidate = 3600;

/** GET /api/v1/stats — live contract totals + the rated wallet universe. */
export async function GET() {
  const [counters, universe] = await Promise.all([
    fetchContractCounters(),
    universeStats().catch(() => null),
  ]);
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
      universe, // null until the indexer has data
    },
    meta: { engine: "halbrook-v0.3", dataSource: "live", refreshed: "hourly" },
  });
}
