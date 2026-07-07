import { resolveWallet } from "@/lib/wallets";

export const maxDuration = 60;

const GRADE_COLORS: Record<string, string> = { A: "#067647", B: "#b54708", C: "#b42318" };

/**
 * GET /api/v1/badge/:address — the embeddable rating seal as an SVG.
 * Cached at the edge for a day; apps and users embed it anywhere:
 *   <img src="https://halbrook.vercel.app/api/v1/badge/0x…" />
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;
  const resolution = await resolveWallet(decodeURIComponent(address));
  if (resolution.kind !== "ok") {
    return new Response("Badge unavailable for this address.", { status: resolution.kind === "invalid" ? 400 : 503 });
  }
  const { result } = resolution.report;
  const color = GRADE_COLORS[result.grade];
  const grade = `${result.grade}${result.modifier}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="Halbrook grade ${grade}">
  <rect x="4" y="4" width="132" height="132" rx="16" fill="#ffffff" stroke="${color}" stroke-width="4"/>
  <text x="70" y="34" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="10" font-weight="600" letter-spacing="3" fill="#667085">HALBROOK</text>
  <text x="70" y="88" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="52" font-weight="700" fill="${color}">${grade}</text>
  <text x="70" y="114" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="10" font-weight="600" letter-spacing="3" fill="#667085">RATED</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
