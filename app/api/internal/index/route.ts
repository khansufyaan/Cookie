import { NextResponse } from "next/server";
import { discoverStep, initSchema, rateStep, universeStats } from "@/lib/indexer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true; // Vercel cron
  const key = new URL(req.url).searchParams.get("key");
  return key === secret; // manual kicks
}

/**
 * GET /api/internal/index — one indexer tick: a discovery slice (up to 2,000
 * transfers into one tracked contract) plus a rating slice (4 wallets, full
 * live engine). Driven by Vercel cron; can be kicked manually with ?key=.
 */
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ready = await initSchema();
  if (!ready) return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });

  const [discovery, rating] = await Promise.all([
    discoverStep().catch((err) => {
      console.error("indexer: discovery failed:", err);
      return null;
    }),
    rateStep().catch((err) => {
      console.error("indexer: rating failed:", err);
      return { rated: 0, errored: 0 };
    }),
  ]);
  const stats = await universeStats();

  return NextResponse.json({ data: { discovery, rating, universe: stats } });
}
