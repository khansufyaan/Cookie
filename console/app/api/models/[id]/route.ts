import { NextResponse } from "next/server";
import { ensureConsoleTables, getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/models/:id — one saved model's levers (for share links). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const modelId = Number(id);
  if (!Number.isInteger(modelId)) return NextResponse.json({ error: "Bad id." }, { status: 400 });
  try {
    const p = getPool();
    if (!p) throw new Error("no database");
    await ensureConsoleTables();
    const { rows } = await p.query(`SELECT id, name, actor, version, levers FROM console_models WHERE id = $1`, [modelId]);
    if (rows.length === 0) return NextResponse.json({ error: "Model not found." }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch {
    return NextResponse.json({ error: "Database unreachable." }, { status: 503 });
  }
}

/** DELETE /api/models/:id — remove a saved model. Business lines bound to it
 *  fall back to the production baseline (model_id nulled). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const modelId = Number(id);
  if (!Number.isInteger(modelId)) return NextResponse.json({ error: "Bad id." }, { status: 400 });
  try {
    const p = getPool();
    if (!p) throw new Error("no database");
    await ensureConsoleTables();
    await p.query(`UPDATE console_business_lines SET model_id = NULL WHERE model_id = $1`, [modelId]);
    const { rows } = await p.query(`DELETE FROM console_models WHERE id = $1 RETURNING name`, [modelId]);
    if (rows.length === 0) return NextResponse.json({ error: "Model not found." }, { status: 404 });
    return NextResponse.json({ data: { deleted: rows[0].name } });
  } catch (err) {
    console.error("model delete failed:", err);
    return NextResponse.json({ error: "Database unreachable." }, { status: 503 });
  }
}
