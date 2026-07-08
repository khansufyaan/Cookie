import { NextResponse } from "next/server";
import { addSubscriber } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SOURCES = new Set(["research", "claim"]);

/** POST /api/v1/subscribe — email capture for the research report and claim waitlist. */
export async function POST(req: Request) {
  let body: { email?: string; source?: string; wallet?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const email = body.email?.trim() ?? "";
  const source = body.source ?? "";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!SOURCES.has(source)) {
    return NextResponse.json({ error: "Unknown source." }, { status: 400 });
  }
  try {
    const ok = await addSubscriber(email, source, body.wallet);
    if (!ok) return NextResponse.json({ error: "List temporarily unavailable." }, { status: 503 });
    return NextResponse.json({ data: { subscribed: true } });
  } catch (err) {
    console.error("subscribe failed:", err);
    return NextResponse.json({ error: "List temporarily unavailable." }, { status: 503 });
  }
}
