import { NextResponse } from "next/server";
import { ensureConsoleTables, getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const EVM = /^0x[a-fA-F0-9]{40}$/;
const SOL = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/**
 * POST /api/watchlists/:id/wallets — bulk-add addresses to a watchlist AND
 * to the monitoring queue (wallets table), where the indexer picks them up
 * for rating. Accepts up to 5,000 addresses per call.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const watchlistId = Number(id);
  if (!Number.isInteger(watchlistId)) {
    return NextResponse.json({ error: "Bad watchlist id." }, { status: 400 });
  }

  let body: { addresses?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const input = Array.isArray(body.addresses) ? body.addresses : [];
  if (input.length === 0) return NextResponse.json({ error: "Provide addresses[]." }, { status: 400 });
  if (input.length > 5000) return NextResponse.json({ error: "Max 5,000 addresses per upload." }, { status: 400 });

  const seen = new Set<string>();
  const valid: { address: string; family: string }[] = [];
  let invalid = 0;
  for (const raw of input) {
    const a = String(raw).trim();
    const evm = EVM.test(a);
    const sol = !evm && SOL.test(a);
    if (!evm && !sol) {
      if (a.length > 0) invalid++;
      continue;
    }
    const norm = evm ? a.toLowerCase() : a;
    if (seen.has(norm)) continue;
    seen.add(norm);
    valid.push({ address: norm, family: evm ? "evm" : "solana" });
  }
  if (valid.length === 0) {
    return NextResponse.json({ error: "No valid EVM or Solana addresses found.", invalid }, { status: 400 });
  }

  try {
    const p = getPool();
    if (!p) throw new Error("no database");
    await ensureConsoleTables();
    const exists = await p.query(`SELECT 1 FROM console_watchlists WHERE id = $1`, [watchlistId]);
    if (exists.rowCount === 0) return NextResponse.json({ error: "Watchlist not found." }, { status: 404 });

    const addrs = valid.map((v) => v.address);
    const fams = valid.map((v) => v.family);

    // Queue for rating (no-op for wallets the indexer already knows).
    const queued = await p.query(
      `INSERT INTO wallets (address, family, discovered_via, status)
       SELECT a, f, 'visa-console', 'pending' FROM unnest($1::text[], $2::text[]) AS t(a, f)
       ON CONFLICT (address) DO NOTHING`,
      [addrs, fams],
    );
    // Attach to the watchlist.
    const linked = await p.query(
      `INSERT INTO console_watchlist_wallets (watchlist_id, address)
       SELECT $1, a FROM unnest($2::text[]) AS t(a)
       ON CONFLICT DO NOTHING`,
      [watchlistId, addrs],
    );

    return NextResponse.json({
      data: {
        submitted: input.length,
        valid: valid.length,
        invalid,
        addedToWatchlist: linked.rowCount ?? 0,
        newlyQueuedForRating: queued.rowCount ?? 0,
      },
      meta: { note: "Newly queued wallets are rated by the indexer within minutes; already-rated wallets appear immediately." },
    });
  } catch (err) {
    console.error("bulk add failed:", err);
    return NextResponse.json({ error: "Database unreachable — try from the deployed console." }, { status: 503 });
  }
}
