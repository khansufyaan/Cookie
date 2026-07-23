import { NextResponse } from "next/server";
import { ensureConsoleTables, getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET — list watchlists with wallet counts. POST {name} — create one. */
export async function GET() {
  try {
    const p = getPool();
    if (!p) throw new Error("no database");
    await ensureConsoleTables();
    const { rows } = await p.query(`
      SELECT w.id, w.name, w.created_at, COUNT(cw.address)::int AS wallet_count
      FROM console_watchlists w
      LEFT JOIN console_watchlist_wallets cw ON cw.watchlist_id = w.id
      GROUP BY w.id ORDER BY w.id
    `);
    return NextResponse.json({ data: rows, meta: { source: "live" } });
  } catch {
    return NextResponse.json({ data: [], meta: { source: "demo" } });
  }
}

export async function POST(req: Request) {
  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const name = body.name?.trim();
  if (!name || name.length > 80) {
    return NextResponse.json({ error: "Provide a name (max 80 chars)." }, { status: 400 });
  }
  try {
    const p = getPool();
    if (!p) throw new Error("no database");
    await ensureConsoleTables();
    const { rows } = await p.query(
      `INSERT INTO console_watchlists (name) VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name`,
      [name],
    );
    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    console.error("watchlist create failed:", err);
    return NextResponse.json({ error: "Database unreachable — try from the deployed console." }, { status: 503 });
  }
}
