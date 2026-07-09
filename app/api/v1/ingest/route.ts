import { NextResponse } from "next/server";
import { meter } from "@/lib/apikeys";
import { APP_BY_ID } from "@/lib/apps";
import { OFAC_ENTRY_COUNT, OFAC_LIST_NAME, isOfacSanctioned } from "@/lib/ofac";
import { monthsBetween, scoreWallet } from "@/lib/scoring";
import { detectFamily } from "@/lib/wallets";
import type { AppActivity } from "@/lib/types";

interface IngestWallet {
  address: string;
  txCount: number;
  volumeUsd: number;
  firstTx: string;
  lastTx: string;
  kycVerified?: boolean; // partner-attested KYC status
}

interface IngestBody {
  appId: string;
  wallets: IngestWallet[];
}

/**
 * POST /api/v1/ingest — the marketplace write side.
 * Partner apps report wallet activity and receive ratings back. Every
 * submitted wallet is screened against the OFAC snapshot. MVP: rates the
 * batch statelessly; production persists to the indexer DB and merges with
 * on-chain history before rating.
 */
export async function POST(req: Request) {
  // Metered (by IP for anonymous callers) so an unauthenticated caller can't
  // drive unbounded scoring work — each batch scores up to 500 wallets.
  const usage = await meter(req);
  if (!usage.allowed) {
    return NextResponse.json(
      usage.tier === "invalid"
        ? { error: "Invalid API key." }
        : { error: `Daily limit reached (${usage.limit}/day on the ${usage.tier} tier).`, tier: usage.tier },
      { status: usage.tier === "invalid" ? 401 : 429 },
    );
  }

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
    const family = w?.address ? detectFamily(w.address) : null;
    if (!family) {
      errors.push({ index: i, error: "Invalid address (EVM 0x… or Solana base58)." });
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
    const rated = scoreWallet(
      {
        address: family === "evm" ? w.address.toLowerCase() : w.address,
        family,
        activities: [activity],
        firstSeen: w.firstTx,
        // Without month-level data we assume activity spread over the reported span.
        activeMonths: Math.min(spanMonths, Math.max(1, Math.floor(activity.txCount / 2))),
      },
      {
        kycVerified: w.kycVerified === true,
        kycSource: w.kycVerified === true ? "Partner-attested via ingest" : "Not attested",
        sanctioned: isOfacSanctioned(w.address),
        sanctionsList: OFAC_LIST_NAME,
        sanctionsEntryCount: OFAC_ENTRY_COUNT,
      },
    );
    results.push({
      address: rated.address,
      grade: rated.grade,
      modifier: rated.modifier,
      score: rated.score,
      tier: rated.tier,
      archetype: rated.archetype,
      ofacSanctioned: rated.sanctions.listed,
    });
  }

  return NextResponse.json({
    data: { appId: body.appId, appKnown: known, rated: results.length, results },
    errors,
    meta: {
      engine: "vwr-v0.4",
      tier: "demo",
      note: "MVP demo tier: batch is rated statelessly on submitted data only (OFAC screening is live). Production merges with indexed cross-app history and persists.",
    },
  });
}
