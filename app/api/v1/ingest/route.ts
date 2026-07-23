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

interface IngestEvent {
  type: string; // open vocabulary: loan.outcome, fraud.flag, payment.chargeback, kyc.attestation, custodial.mapping, …
  wallet: string;
  observedAt: string; // ISO date
  payload?: Record<string, unknown>;
}

interface IngestBody {
  appId: string;
  wallets?: IngestWallet[];
  events?: IngestEvent[];
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
  const hasWallets = Array.isArray(body.wallets) && body.wallets.length > 0;
  const hasEvents = Array.isArray(body.events) && body.events.length > 0;
  if (!hasWallets && !hasEvents) {
    return NextResponse.json({ error: "Send a non-empty wallets[] and/or events[] array." }, { status: 400 });
  }
  if ((body.wallets?.length ?? 0) > 500 || (body.events?.length ?? 0) > 500) {
    return NextResponse.json({ error: "Max 500 wallets/events per batch." }, { status: 400 });
  }

  const known = APP_BY_ID.has(body.appId);
  const results = [];
  const errors = [];

  // Off-chain event envelope: open type vocabulary, validated per-event and
  // OFAC-screened. MVP acknowledges the batch; production persists events to
  // the outcome ledger and feeds the network risk model.
  const events: { index: number; type: string; wallet: string; ofacSanctioned: boolean }[] = [];
  if (hasEvents) {
    for (const [i, e] of body.events!.entries()) {
      if (!e || typeof e.type !== "string" || e.type.length === 0 || e.type.length > 64) {
        errors.push({ index: i, error: "events[].type must be a short string (e.g. loan.outcome)." });
        continue;
      }
      if (!e.wallet || !detectFamily(e.wallet)) {
        errors.push({ index: i, error: "events[].wallet must be a valid EVM or Solana address." });
        continue;
      }
      if (!e.observedAt || Number.isNaN(Date.parse(e.observedAt))) {
        errors.push({ index: i, error: "events[].observedAt must be an ISO date." });
        continue;
      }
      events.push({ index: i, type: e.type, wallet: e.wallet, ofacSanctioned: isOfacSanctioned(e.wallet) });
    }
  }

  if (!hasWallets) {
    return NextResponse.json({
      data: { appId: body.appId, appKnown: known, rated: 0, results: [], eventsAccepted: events.length, events },
      errors,
      meta: {
        engine: "vwr-v0.4",
        tier: "demo",
        note: "Events acknowledged and screened. Production persists them to the outcome ledger and they inform future scores.",
      },
    });
  }

  for (const [i, w] of body.wallets!.entries()) {
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
    data: {
      appId: body.appId,
      appKnown: known,
      rated: results.length,
      results,
      ...(events.length > 0 ? { eventsAccepted: events.length, events } : {}),
    },
    errors,
    meta: {
      engine: "vwr-v0.4",
      tier: "demo",
      note: "MVP demo tier: batch is rated statelessly on submitted data only (OFAC screening is live). Production merges with indexed cross-app history and persists.",
    },
  });
}
