import { NextResponse } from "next/server";
import { createApiKey } from "@/lib/apikeys";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * POST /api/v1/keys — self-serve free-tier API key. The key is returned
 * exactly once; only its hash is stored.
 */
export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const email = body.email?.trim() ?? "";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  try {
    const result = await createApiKey(email);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 409 });
    return NextResponse.json({
      data: {
        key: result.key,
        tier: "free",
        dailyLimit: 1000,
        note: "Store this key now — it is shown exactly once. Pass it as 'Authorization: Bearer <key>'.",
      },
    });
  } catch (err) {
    console.error("key creation failed:", err);
    return NextResponse.json({ error: "Key service temporarily unavailable." }, { status: 503 });
  }
}
