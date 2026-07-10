import { NextResponse, type NextRequest } from "next/server";

/**
 * Site-wide password gate (HTTP Basic Auth). Active only when SITE_PASSWORD is
 * set — unset it to open the site again. Credentials come from env so no
 * secret lives in the repo. Static assets are excluded so the login prompt
 * and page render normally once authenticated.
 */
export function middleware(req: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next(); // gate disabled

  const expectedUser = process.env.SITE_USER || "visa";
  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const sep = decoded.indexOf(":");
      const user = decoded.slice(0, sep);
      const pass = decoded.slice(sep + 1);
      if (user === expectedUser && pass === password) return NextResponse.next();
    } catch {
      /* malformed header — fall through to challenge */
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Visa Wallet Rating — preview", charset="UTF-8"',
    },
  });
}

export const config = {
  // Gate everything except Next's static assets and the favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
