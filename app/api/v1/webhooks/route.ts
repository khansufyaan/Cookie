import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { meter } from "@/lib/apikeys";
import { registerWebhook, removeWebhook, WEBHOOK_EVENTS, type WebhookEvent } from "@/lib/db";

/**
 * POST /api/v1/webhooks — subscribe a URL to rating events.
 * Body: { url: "https://…", events: ["grade.changed", "sanctions.listed"] }
 * Returns { id, secret } — the secret signs every delivery (HMAC-SHA256 of
 * the raw body in X-VWR-Signature) and is shown exactly once.
 * DELETE — body { id, secret } unsubscribes.
 */
export async function POST(req: Request) {
  const usage = await meter(req);
  if (!usage.allowed) {
    return NextResponse.json({ error: "Rate limit reached." }, { status: usage.tier === "invalid" ? 401 : 429 });
  }

  let body: { url?: string; events?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(body.url ?? "");
  } catch {
    return NextResponse.json({ error: "url must be a valid URL." }, { status: 400 });
  }
  if (url.protocol !== "https:") {
    return NextResponse.json({ error: "url must be https." }, { status: 400 });
  }
  const events = (body.events ?? []).filter((e): e is WebhookEvent =>
    (WEBHOOK_EVENTS as readonly string[]).includes(e),
  );
  if (events.length === 0) {
    return NextResponse.json(
      { error: `events must include at least one of: ${WEBHOOK_EVENTS.join(", ")}` },
      { status: 400 },
    );
  }

  const secret = `whsec_${randomBytes(24).toString("hex")}`;
  const id = await registerWebhook(url.toString(), events, secret);
  if (id == null) return NextResponse.json({ error: "Webhook store unavailable." }, { status: 503 });

  return NextResponse.json({
    data: {
      id,
      url: url.toString(),
      events,
      secret,
      note: "Store this secret — it is shown exactly once. Verify deliveries via X-VWR-Signature (HMAC-SHA256 of the raw body).",
    },
  });
}

export async function DELETE(req: Request) {
  let body: { id?: number; secret?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  if (typeof body.id !== "number" || typeof body.secret !== "string") {
    return NextResponse.json({ error: "Provide id and secret." }, { status: 400 });
  }
  const ok = await removeWebhook(body.id, body.secret);
  if (!ok) return NextResponse.json({ error: "Not found (or wrong secret)." }, { status: 404 });
  return NextResponse.json({ data: { removed: true } });
}
