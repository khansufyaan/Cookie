import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  if (header && safeEqual(header, `Bearer ${secret}`)) return true;
  const key = new URL(req.url).searchParams.get("key");
  return key != null && safeEqual(key, secret);
}

/**
 * GET /api/internal/exemplars — admin-only. Returns the best example wallets
 * per grade and per archetype from the rated universe, for demos/QA.
 */
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p = getPool();
  if (!p) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const cols = "address, score, grade, modifier, tier, archetype, tx_count, volume_usd, apps_used, kyc_verified";
  const byGrade: Record<string, unknown> = {};
  for (const g of ["A", "B", "C"]) {
    const { rows } = await p.query(
      `SELECT ${cols} FROM ratings
       WHERE grade = $1 AND sanctioned = false AND tx_count > 0
       ORDER BY apps_used DESC, volume_usd DESC LIMIT 3`,
      [g],
    );
    byGrade[g] = rows;
  }

  const byArchetype: Record<string, unknown> = {};
  for (const a of ["Whale", "Power User", "Blue Chip", "Explorer", "Regular"]) {
    const { rows } = await p.query(
      `SELECT ${cols} FROM ratings
       WHERE archetype = $1 AND sanctioned = false
       ORDER BY apps_used DESC, volume_usd DESC LIMIT 3`,
      [a],
    );
    byArchetype[a] = rows;
  }

  const dist = await p.query(`SELECT grade, count(*)::int n FROM ratings GROUP BY grade ORDER BY grade`);
  const arch = await p.query(`SELECT archetype, count(*)::int n FROM ratings GROUP BY archetype ORDER BY n DESC`);
  const uni = await p.query(
    `SELECT count(*)::int discovered, count(*) FILTER (WHERE status='rated')::int rated FROM wallets`,
  );

  return NextResponse.json({
    universe: uni.rows[0],
    gradeDistribution: dist.rows,
    archetypeDistribution: arch.rows,
    byGrade,
    byArchetype,
  });
}
