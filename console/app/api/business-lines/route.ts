import { NextResponse } from "next/server";
import { ensureConsoleTables, getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET — business lines with their bound model + watchlist.
 *  POST {id, modelId?, watchlistId?} — bind a published model / watchlist. */
export async function GET() {
  try {
    const p = getPool();
    if (!p) throw new Error("no database");
    await ensureConsoleTables();
    const { rows } = await p.query(`
      SELECT b.id, b.name, b.api_key,
             b.model_id, m.name AS model_name, m.version AS model_version,
             b.watchlist_id, w.name AS watchlist_name
      FROM console_business_lines b
      LEFT JOIN console_models m ON m.id = b.model_id
      LEFT JOIN console_watchlists w ON w.id = b.watchlist_id
      ORDER BY b.id
    `);
    return NextResponse.json({ data: rows, meta: { source: "live" } });
  } catch {
    return NextResponse.json({
      data: [
        { id: 1, name: "Visa Direct", api_key: "vrc_live_demo_visadirect", model_id: null, model_name: null, watchlist_id: null, watchlist_name: null },
        { id: 2, name: "Global Treasury", api_key: "vrc_live_demo_treasury", model_id: null, model_name: null, watchlist_id: null, watchlist_name: null },
      ],
      meta: { source: "demo" },
    });
  }
}

export async function POST(req: Request) {
  let body: { id?: number; modelId?: number | null; watchlistId?: number | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  if (!Number.isInteger(body.id)) return NextResponse.json({ error: "Provide a business line id." }, { status: 400 });
  try {
    const p = getPool();
    if (!p) throw new Error("no database");
    await ensureConsoleTables();
    const { rows } = await p.query(
      `UPDATE console_business_lines
       SET model_id = COALESCE($2, model_id), watchlist_id = COALESCE($3, watchlist_id)
       WHERE id = $1 RETURNING id, name, model_id, watchlist_id`,
      [body.id, body.modelId ?? null, body.watchlistId ?? null],
    );
    if (rows.length === 0) return NextResponse.json({ error: "Business line not found." }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    console.error("business line update failed:", err);
    return NextResponse.json({ error: "Database unreachable." }, { status: 503 });
  }
}
