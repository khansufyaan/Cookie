import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.json({ ok: true });

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  if (body.password !== password) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const token = createHash("sha256").update(`vrc:${password}`).digest("hex");
  const res = NextResponse.json({ ok: true });
  res.cookies.set("vrc_gate", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
