import { NextResponse, type NextRequest } from "next/server";

/**
 * Site-wide password gate. Active only when SITE_PASSWORD is set (unset to
 * reopen the site). Cookie-based rather than HTTP Basic Auth because Vercel
 * strips the WWW-Authenticate header from middleware responses, so the browser
 * never shows the native prompt. Unauthenticated requests are redirected to a
 * branded /gate login page.
 */
const COOKIE = "vwr_gate";

async function expectedToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`vwr:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(req: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next(); // gate disabled

  const { pathname } = req.nextUrl;
  // The login page and its endpoint must be reachable while locked out.
  if (pathname === "/gate" || pathname === "/api/gate") return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  if (token && token === (await expectedToken(password))) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/gate";
  url.search = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
