const TW = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets";

/**
 * Curated, verified logo sources — official brand marks as transparent PNGs
 * (Trust Wallet's asset registry, keyed by token contract). These take
 * priority; favicon guessing is only a fallback for domains not listed.
 * Token pseudo-domains (e.g. "usdc.token") exist because a stablecoin's
 * issuer favicon (Circle, Sky, PayPal) is not the coin's mark.
 */
const CURATED: Record<string, string> = {
  // Protocols (EVM) — official project marks
  "uniswap.org": `${TW}/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png`,
  "aave.com": `${TW}/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png`,
  "lido.fi": `${TW}/0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32/logo.png`,
  "morpho.org": `${TW}/0x58D97B57BB95320F9a05dC918Aef65434969c2B2/logo.png`,
  "curve.finance": `${TW}/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png`,
  "1inch.io": `${TW}/0x111111111117dC0aa78b770fA6A738034120C302/logo.png`,
  "ethena.fi": `${TW}/0x57e114B691Db790C35207b2e685D4A43181e6061/logo.png`,
  "eigenlayer.xyz": `${TW}/0xec53bF9167f50cDEB3Ae105f56099aaaB9061F83/logo.png`,
  "pendle.finance": `${TW}/0x808507121B80c02388fAd14726482e061B8da827/logo.png`,
  // Stablecoins — the coin's mark, not the issuer's favicon
  "usdc.token": `${TW}/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png`,
  "usdt.token": `${TW}/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png`,
  "dai.token": `${TW}/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png`,
  "usde.token": `${TW}/0x4c9EDD5852cd905f086C759E8383e09bff1E68B3/logo.png`,
  "pyusd.token": `${TW}/0x6c3ea9036406852006290770BEdFcAbA0e23A0e8/logo.png`,
  "usds.token": `${TW}/0xdC035D45d973E3EC169d2276DDab16f1e407384F/logo.png`,
  "fdusd.token": `${TW}/0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409/logo.png`,
};

const LLAMA_SLUGS: Record<string, string> = {
  "uniswap.org": "uniswap", "aave.com": "aave", "lido.fi": "lido", "morpho.org": "morpho",
  "curve.finance": "curve-finance", "1inch.io": "1inch-network", "polymarket.com": "polymarket",
  "ethena.fi": "ethena", "pendle.finance": "pendle", "jup.ag": "jupiter", "raydium.io": "raydium",
  "orca.so": "orca", "pump.fun": "pump.fun", "swap.pump.fun": "pumpswap", "meteora.ag": "meteora",
  "kamino.finance": "kamino", "drift.trade": "drift", "jito.network": "jito", "marinade.finance": "marinade-finance",
};

/**
 * GET /api/logo/:domain — logo proxy: curated official marks first, DefiLlama
 * protocol icons second, favicon lookup as fallback, transparent pixel as
 * last resort. Edge-cached for a week.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  if (!/^[a-z0-9.-]+$/i.test(domain)) return new Response("Bad domain", { status: 400 });
  const sources = [
    ...(CURATED[domain] ? [CURATED[domain]] : []),
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
