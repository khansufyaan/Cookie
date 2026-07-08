import { NextResponse } from "next/server";
import { studyCohort } from "@/lib/actions";

export const revalidate = 3600;
export const maxDuration = 60;

/** GET /api/v1/actions — recent rating actions (live sample; hourly). */
export async function GET() {
  const { actions } = await studyCohort(10);
  return NextResponse.json({
    data: actions,
    meta: { engine: "vwr-v0.4", dataSource: "live", refreshed: "hourly" },
  });
}
