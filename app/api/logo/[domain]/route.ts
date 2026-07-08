const LLAMA_SLUGS: Record<string, string> = {
  "uniswap.org": "uniswap", "aave.com": "aave", "lido.fi": "lido", "morpho.org": "morpho",
  "curve.finance": "curve-finance", "1inch.io": "1inch-network", "polymarket.com": "polymarket",
  "ethena.fi": "ethena", "pendle.finance": "pendle", "jup.ag": "jupiter", "raydium.io": "raydium",
  "orca.so": "orca", "pump.fun": "pump.fun", "swap.pump.fun": "pumpswap", "meteora.ag": "meteora",
  "kamino.finance": "kamino", "drift.trade": "drift", "jito.network": "jito", "marinade.finance": "marinade-finance",
};

/**
 * GET /api/logo/:domain — logo proxy: DefiLlama protocol icons first (clean
 * brand marks), favicon lookup as fallback, transparent pixel as last
 * resort. Edge-cached for a week.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  if (!/^[a-z0-9.-]+$/i.test(domain)) return new Response("Bad domain", { status: 400 });
  const sources = [
    ...(LLAMA_SLUGS[domain] ? [`https://icons.llamao.fi/icons/protocols/${LLAMA_SLUGS[domain]}?w=128`] : []),
    `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`,
  ];
  for (const url of sources) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 604800 } });
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      return new Response(buf, {
        headers: {
          "content-type": res.headers.get("content-type") ?? "image/png",
          "cache-control": "public, s-maxage=604800, stale-while-revalidate=604800",
        },
      });
    } catch {
      /* try next source */
    }
  }
  const px = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5CYII="), (c) => c.charCodeAt(0));
  return new Response(px, { headers: { "content-type": "image/png", "cache-control": "public, s-maxage=3600" } });
}
