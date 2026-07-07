import { NextResponse } from "next/server";
import { APP_BY_ID } from "@/lib/apps";
import { monthsBetween, scoreWallet } from "@/lib/scoring";
import { isEthAddress } from "@/lib/wallets";
import type { AppActivity } from "@/lib/types";

interface IngestWallet {
  address: string;
  txCount: number;
  volumeUsd: number;
  firstTx: string;
  lastTx: string;
}

interface IngestBody {
  appId: string;
  wallets: IngestWallet[];
}

/**
 * POST /api/v1/ingest — the marketplace write side.
 * Partner apps report wallet activity and receive A/B/C ratings back.
 * MVP: rates the submitted batch statelessly; production persists to the
 * indexer DB and merges with on-chain history before rating.
 */
export async function POST(req: Request) {
  let body: IngestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  if (!body.appId || typeof body.appId !== "string") {
    return NextResponse.json({ error: "Missing appId." }, { status: 400 });
  }
  if (!Array.isArray(body.wallets) || body.wallets.length === 0) {
    return NextResponse.json({ error: "wallets must be a non-empty array." }, { status: 400 });
  }
  if (body.wallets.length > 500) {
    return NextResponse.json({ error: "Max 500 wallets per batch." }, { status: 400 });
  }

  const known = APP_BY_ID.has(body.appId);
  const results = [];
  const errors = [];

  for (const [i, w] of body.wallets.entries()) {
    if (!w || !isEthAddress(w.address ?? "")) {
      errors.push({ index: i, error: "Invalid address." });
      continue;
    }
    if (!(Number.isFinite(w.txCount) && w.txCount >= 0 && Number.isFinite(w.volumeUsd) && w.volumeUsd >= 0)) {
      errors.push({ index: i, address: w.address, error: "txCount and volumeUsd must be non-negative numbers." });
      continue;
    }
    const activity: AppActivity = {
      appId: body.appId,
      txCount: Math.floor(w.txCount),
      volumeUsd: w.volumeUsd,
      firstTx: w.firstTx,
      lastTx: w.lastTx,
    };
    const ageMonths = Math.max(1, monthsBetween(w.firstTx));
    const spanMonths = Math.max(1, ageMonths - monthsBetween(w.lastTx));
    const rated = scoreWallet({
      address: w.address.toLowerCase(),
      activities: [activity],
      firstSeen: w.firstTx,
      // Without month-level data we assume activity spread over the reported span.
      activeMonths: Math.min(spanMonths, Math.max(1, Math.floor(activity.txCount / 2))),
    });
    results.push({
      address: rated.address,
      grade: rated.grade,
      modifier: rated.modifier,
      score: rated.score,
      archetype: rated.archetype,
    });
  }

  return NextResponse.json({
    data: { appId: body.appId, appKnown: known, rated: results.length, results },
    errors,
    meta: {
      engine: "crumb-v0.1",
      tier: "demo",
      note: "MVP demo tier: batch is rated statelessly on submitted data only. Production merges with indexed cross-app history, persists, and mints/updates the wallet's Cookie SBT.",
    },
  });
}
