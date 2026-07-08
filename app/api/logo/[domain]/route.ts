/**
 * GET /api/logo/:domain — server-side proxy for project logos (favicon
 * lookup), so the client never depends on third-party endpoints. Replaced by
 * first-party brand assets later. Edge-cached for a week.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ domain: string }> },
) {
  const { domain } = await params;
  if (!/^[a-z0-9.-]+$/i.test(domain)) return new Response("Bad domain", { status: 400 });
  try {
    const res = await fetch(
      `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=64`,
      { signal: AbortSignal.timeout(8000), next: { revalidate: 604800 } },
    );
    if (!res.ok) throw new Error(String(res.status));
    const buf = await res.arrayBuffer();
    return new Response(buf, {
      headers: {
        "content-type": res.headers.get("content-type") ?? "image/png",
        "cache-control": "public, s-maxage=604800, stale-while-revalidate=604800",
      },
    });
  } catch {
    // 1x1 transparent PNG fallback — never a broken-image icon.
    const px = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));
    return new Response(px, { headers: { "content-type": "image/png", "cache-control": "public, s-maxage=3600" } });
  }
}
