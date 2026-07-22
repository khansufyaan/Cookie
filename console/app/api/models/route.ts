import { NextResponse } from "next/server";
import { ensureConsoleTables, getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET — saved models + recent audit trail. POST {name, actor, levers} — publish
 *  a model (upsert bumps the version; every publish appends an audit row). */
export async function GET() {
  try {
    const p = getPool();
    if (!p) throw new Error("no database");
    await ensureConsoleTables();
    const [models, audit] = await Promise.all([
      p.query(`SELECT id, name, actor, version, updated_at, levers FROM console_models ORDER BY updated_at DESC LIMIT 50`),
      p.query(`SELECT model_name, version, actor, created_at FROM console_model_audit ORDER BY id DESC LIMIT 8`),
    ]);
    return NextResponse.json({ data: { models: models.rows, audit: audit.rows }, meta: { source: "live" } });
  } catch {
    return NextResponse.json({ data: { models: [], audit: [] }, meta: { source: "demo" } });
  }
}

export async function POST(req: Request) {
  let body: { name?: string; actor?: string; levers?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const name = body.name?.trim();
  const actor = (body.actor ?? "").trim().slice(0, 60);
  if (!name || name.length > 80) return NextResponse.json({ error: "Provide a model name (max 80 chars)." }, { status: 400 });
  if (!body.levers || typeof body.levers !== "object") return NextResponse.json({ error: "Missing levers." }, { status: 400 });

  try {
    const p = getPool();
    if (!p) throw new Error("no database");
    await ensureConsoleTables();
    const { rows } = await p.query(
      `INSERT INTO console_models (name, levers, actor)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE
         SET levers = EXCLUDED.levers, actor = EXCLUDED.actor,
             version = console_models.version + 1, updated_at = now()
       RETURNING id, name, version`,
      [name, JSON.stringify(body.levers), actor],
    );
    const m = rows[0];
    await p.query(
      `INSERT INTO console_model_audit (model_name, version, actor, levers) VALUES ($1, $2, $3, $4)`,
      [m.name, m.version, actor, JSON.stringify(body.levers)],
    );
    return NextResponse.json({ data: m });
  } catch (err) {
    console.error("model publish failed:", err);
    return NextResponse.json({ error: "Database unreachable — publish from the deployed console." }, { status: 503 });
  }
}
