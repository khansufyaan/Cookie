import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/wallet/:address — stored month-end score history (sparkline). */
export async function GET(_req: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  try {
    const p = getPool();
    if (!p) throw new Error("no database");
    const { rows } = await p.query(`SELECT history FROM ratings WHERE address = $1`, [address.toLowerCase()]);
    const history = Array.isArray(rows[0]?.history) ? rows[0].history : [];
    return NextResponse.json({
      data: history.map((h: { month?: string; score?: number }) => ({ month: h.month ?? "", score: Number(h.score) || 0 })),
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
