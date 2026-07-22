import { NextResponse, type NextRequest } from "next/server";

/** Cookie password gate — same pattern as the public site (Vercel strips
 *  WWW-Authenticate from middleware responses, so no Basic Auth). */
const COOKIE = "vrc_gate";

async function expectedToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`vrc:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(req: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname === "/gate" || pathname === "/api/gate") return NextResponse.next();
  // The business-line API surface authenticates with its own per-line key
  // (X-VRC-Key) — external callers can't carry the browser gate cookie.
  if (pathname.startsWith("/api/v1/")) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  if (token && token === (await expectedToken(password))) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/gate";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
