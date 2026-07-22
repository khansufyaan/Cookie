import { NextResponse } from "next/server";
import { assess, lookupCex, verdictMeta, weightFor, type Evidence } from "@/lib/uscex";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

const EVM = /^0x[a-fA-F0-9]{40}$/;
const TIMEOUT = 12_000;
const PAGES = 6; // up to 6k transfers per direction

interface Transfer {
  hash: string;
  from: string;
  to: string | null;
  metadata?: { blockTimestamp?: string };
}

async function alchemy(url: string, params: Record<string, unknown>): Promise<Transfer[]> {
  const out: Transfer[] = [];
  let pageKey: string | undefined;
  for (let i = 0; i < PAGES; i++) {
    const res = await fetch(url, {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT),
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "alchemy_getAssetTransfers",
        params: [{ category: ["external", "erc20"], withMetadata: true, order: "asc", maxCount: "0x3e8", ...params, ...(pageKey ? { pageKey } : {}) }],
      }),
    });
    if (!res.ok) throw new Error(`alchemy ${res.status}`);
    const data = (await res.json()) as { result?: { transfers?: Transfer[]; pageKey?: string }; error?: { message: string } };
    if (data.error) throw new Error(data.error.message);
    out.push(...(data.result?.transfers ?? []));
    pageKey = data.result?.pageKey;
    if (!pageKey) break;
  }
  return out;
}

// Coinbase Verifications attestation (EAS on Base) — a US-KYC proof signal.
const EAS = "https://base.easscan.org/graphql";
const COINBASE_ATTESTER = "0x357458739F90461b99789350868CD7CF330Dd7EE";
async function hasCoinbaseAttestation(address: string): Promise<boolean> {
  try {
    const res = await fetch(EAS, {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT),
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: `query($r:String!,$a:String!){attestations(where:{recipient:{equals:$r,mode:insensitive},attester:{equals:$a},revoked:{equals:false}},take:1){id}}`,
        variables: { r: address, a: COINBASE_ATTESTER },
      }),
    });
    const j = (await res.json()) as { data?: { attestations?: unknown[] } };
    return (j.data?.attestations?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * GET /api/us-exposure/:address — is this wallet a US person?
 * Scans Ethereum transfer history both directions for interactions with
 * US-regulated exchange hot wallets, plus the Coinbase Verifications
 * attestation, and returns a weighted verdict with the evidence.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address: raw } = await params;
  const address = raw.trim().toLowerCase();
  if (!EVM.test(address)) {
    return NextResponse.json({ error: "Enter a valid EVM (0x…) address. US-exchange detection is EVM-only for now." }, { status: 400 });
  }

  const key = process.env.ALCHEMY_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Detector not configured (missing chain data source)." }, { status: 503 });
  }
  const url = `https://eth-mainnet.g.alchemy.com/v2/${key}`;

  try {
    const [incoming, outgoing, attested] = await Promise.all([
      alchemy(url, { toAddress: address }), // funds INTO the wallet → withdrawals from CEX
      alchemy(url, { fromAddress: address }), // funds OUT of the wallet → deposits to CEX
      hasCoinbaseAttestation(address),
    ]);

    // Dedupe evidence per (entity, direction): keep the earliest transaction.
    const best = new Map<string, Evidence>();
    const consider = (kind: "withdrawal" | "deposit", counterparty: string | null, hash: string, ts?: string) => {
      if (!counterparty) return;
      const cex = lookupCex(counterparty);
      if (!cex) return;
      const k = `${cex.name}:${kind}`;
      const date = (ts ?? "").slice(0, 10);
      const ev: Evidence = {
        kind,
        entity: cex.name,
        tier: cex.tier,
        weight: weightFor(kind, cex.tier),
        detail:
          kind === "withdrawal"
            ? `Received funds directly from a ${cex.name} hot wallet`
            : `Sent funds directly to a ${cex.name} hot wallet`,
        txHash: hash,
        date,
      };
      const prev = best.get(k);
      if (!prev || (date && prev.date && date < prev.date)) best.set(k, ev);
    };

    for (const t of incoming) consider("withdrawal", t.from?.toLowerCase() ?? null, t.hash, t.metadata?.blockTimestamp);
    for (const t of outgoing) consider("deposit", t.to?.toLowerCase() ?? null, t.hash, t.metadata?.blockTimestamp);

    const evidence = [...best.values()];
    if (attested) {
      evidence.push({
        kind: "attestation",
        entity: "Coinbase",
        tier: "us-regulated",
        weight: weightFor("attestation", "us-regulated"),
        detail: "Holds a Coinbase Verifications attestation (EAS on Base)",
      });
    }

    const result = assess(evidence);
    const meta = verdictMeta(result.verdict);

    return NextResponse.json({
      data: {
        address,
        verdict: result.verdict,
        verdictLabel: meta.label,
        summary: meta.blurb,
        probability: Number(result.probability.toFixed(3)),
        usResidentOnlySignal: result.hasUsOnly,
        evidence: result.evidence,
        scanned: { incoming: incoming.length, outgoing: outgoing.length },
      },
      meta: {
        method: "Direct counterparty match against a US-regulated-exchange hot-wallet registry + Coinbase Verifications attestation.",
        caveats: [
          "Withdrawals from a labeled exchange are the strongest signal; the exchange KYC'd the recipient.",
          "Coinbase / Kraken / Gemini serve non-US users too — their signal proves US-venue KYC, not US residency. Binance.US is US-resident-only.",
          "No signal is NOT proof of non-US: privacy tools, fresh wallets, and DEX-only histories leave no trace.",
          "Registry is a seed of widely-published addresses; production should ingest a maintained labeled-address feed and add deposit-sweep tracing.",
        ],
      },
    });
  } catch (err) {
    console.error("us-exposure failed:", err);
    return NextResponse.json({ error: "Chain scan failed — try again shortly." }, { status: 503 });
  }
}
