import { NextResponse } from "next/server";
import { ensureConsoleTables, getPool } from "@/lib/db";
import { DEFAULT_LEVERS, scoreRow, type Levers, type WalletRow } from "@/lib/model";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const EVM = /^0x[a-fA-F0-9]{40}$/;
const SOL = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/**
 * GET /api/v1/assess/:address — the business-line API.
 *
 * Auth: X-VRC-Key header (each business line has its own key). The wallet is
 * scored under the model BOUND to that business line (set in the console),
 * overridable per-call with ?model=<id>. So Visa Direct and Global Treasury
 * can hit the same endpoint with the same wallet and get different answers —
 * each under their own risk policy.
 *
 * 200 → { score, band, model, metrics }
 * 202 → wallet not rated yet; it has been queued automatically.
 */
export async function GET(req: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address: raw } = await params;
  const address = EVM.test(raw) ? raw.toLowerCase() : raw;
  if (!EVM.test(raw) && !SOL.test(raw)) {
    return NextResponse.json({ error: "Invalid address — EVM (0x…) or Solana expected." }, { status: 400 });
  }

  const key = req.headers.get("x-vrc-key") ?? new URL(req.url).searchParams.get("key") ?? "";
  if (!key) return NextResponse.json({ error: "Missing X-VRC-Key header." }, { status: 401 });

  try {
    const p = getPool();
    if (!p) throw new Error("no database");
    await ensureConsoleTables();

    const bl = await p.query(
      `SELECT b.id, b.name, b.model_id FROM console_business_lines b WHERE b.api_key = $1`,
      [key],
    );
    if (bl.rowCount === 0) return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
    const line = bl.rows[0];

    // Resolve the model: per-call override → bound model → production default.
    const overrideId = Number(new URL(req.url).searchParams.get("model"));
    const modelId = Number.isInteger(overrideId) && overrideId > 0 ? overrideId : line.model_id;
    let levers: Levers = { ...DEFAULT_LEVERS };
    let modelMeta: { id: number | null; name: string; version: number } = { id: null, name: "production-baseline", version: 0 };
    if (modelId) {
      const m = await p.query(`SELECT id, name, version, levers FROM console_models WHERE id = $1`, [modelId]);
      if (m.rowCount) {
        levers = { ...DEFAULT_LEVERS, ...m.rows[0].levers };
        modelMeta = { id: m.rows[0].id, name: m.rows[0].name, version: m.rows[0].version };
      }
    }

    const r = await p.query(
      `SELECT address, score, tx_count, volume_usd, apps_used, kyc_verified, sanctioned, archetype
       FROM ratings WHERE address = $1`,
      [address],
    );
    if (r.rowCount === 0) {
      await p.query(
        `INSERT INTO wallets (address, family, discovered_via, status)
         VALUES ($1, $2, 'assess-api', 'pending') ON CONFLICT (address) DO NOTHING`,
        [address, EVM.test(raw) ? "evm" : "solana"],
      );
      return NextResponse.json(
        {
          data: { address, status: "queued" },
          meta: { businessLine: line.name, note: "Wallet not rated yet — queued for the indexer. Retry in a few minutes." },
        },
        { status: 202 },
      );
    }

    const row: WalletRow = {
      address: r.rows[0].address,
      txCount: Number(r.rows[0].tx_count),
      volumeUsd: Number(r.rows[0].volume_usd),
      appsUsed: Number(r.rows[0].apps_used),
      kycVerified: Boolean(r.rows[0].kyc_verified),
      sanctioned: Boolean(r.rows[0].sanctioned),
      archetype: r.rows[0].archetype,
      baselineScore: Number(r.rows[0].score),
    };
    const scored = scoreRow(row, levers);

    return NextResponse.json({
      data: {
        address: row.address,
        score: scored.score,
        band: scored.band,
        sanctioned: row.sanctioned,
        kycVerified: row.kycVerified,
        metrics: { txCount: row.txCount, volumeUsd: row.volumeUsd, appsUsed: row.appsUsed, archetype: row.archetype },
        model: modelMeta,
      },
      meta: { businessLine: line.name, engine: "vrc-parametric-v1" },
    });
  } catch (err) {
    console.error("assess failed:", err);
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }
}
