import { EVM_APP_BY_CONTRACT } from "./apps";
import type { AppActivity, WalletProfile } from "./types";

/**
 * Live tier: reads real chain data per lookup.
 *
 * Primary source (when ALCHEMY_API_KEY is set): Alchemy getAssetTransfers —
 * the wallet's FULL outgoing history (paginated, capped at 10k transfers),
 * matched against tracked entry-point contracts. USD volume counts ETH legs
 * (at current price) and major stablecoins at $1; other token legs count
 * toward Usage but not Magnitude.
 *
 * Fallback (no key): Blockscout public API, most recent ~250 transactions.
 *
 * Disclosed limits: interactions routed through pools/periphery contracts we
 * don't enumerate are undercounted; Polygon (Polymarket) and Solana need
 * their own indexer connections.
 */

const TIMEOUT_MS = 10000;
const ALCHEMY_PAGE_LIMIT = 10; // 10 x 1000 transfers
const STABLECOINS = new Set(["USDC", "USDT", "DAI", "USDE", "FDUSD", "PYUSD", "USDS"]);

function alchemyUrl(): string | null {
  const key = process.env.ALCHEMY_API_KEY;
  return key ? `https://eth-mainnet.g.alchemy.com/v2/${key}` : null;
}

async function fetchJson(url: string, init?: RequestInit, retries = 1): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`${res.status} from ${url.split("/v2/")[0]}`);
      return await res.json();
    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
}

async function ethPriceUsd(): Promise<number> {
  try {
    const stats = (await fetchJson("https://eth.blockscout.com/api/v2/stats", {
      headers: { accept: "application/json" },
      next: { revalidate: 300 },
    } as RequestInit)) as { coin_price?: string };
    const p = Number(stats.coin_price);
    return Number.isFinite(p) && p > 0 ? p : 0;
  } catch {
    return 0;
  }
}

export interface MatchedTx {
  appId: string;
  hash: string;
  date: string; // YYYY-MM-DD
  usd: number;
}

export interface MonthlyScoreInput {
  month: string; // YYYY-MM
  asOf: Date; // month end
}

export interface LiveLookup {
  profile: WalletProfile;
  matched: MatchedTx[]; // per-tx matched history (for the score timeline)
  scannedTx: number;
  windowCapped: boolean;
  source: "alchemy" | "blockscout";
}

interface AlchemyTransfer {
  hash: string;
  to: string | null;
  value: number | null;
  asset: string | null;
  category: "external" | "erc20";
  metadata?: { blockTimestamp?: string };
}

/** Aggregate matched per-tx records into a WalletProfile. */
export function buildProfileFromMatched(
  address: string,
  matched: MatchedTx[],
  upTo?: string, // inclusive YYYY-MM-DD cutoff for historical snapshots
): WalletProfile {
  const rows = upTo ? matched.filter((m) => m.date <= upTo) : matched;
  const byApp = new Map<string, { hashes: Set<string>; usd: number; first: string; last: string }>();
  const months = new Set<string>();
  let firstSeen = "";
  for (const m of rows) {
    months.add(m.date.slice(0, 7));
    if (!firstSeen || m.date < firstSeen) firstSeen = m.date;
    const cur = byApp.get(m.appId) ?? { hashes: new Set(), usd: 0, first: m.date, last: m.date };
    cur.hashes.add(m.hash);
    cur.usd += m.usd;
    if (m.date < cur.first) cur.first = m.date;
    if (m.date > cur.last) cur.last = m.date;
    byApp.set(m.appId, cur);
  }
  const activities: AppActivity[] = [...byApp.entries()].map(([appId, v]) => ({
    appId,
    txCount: v.hashes.size,
    volumeUsd: Math.round(v.usd),
    firstTx: v.first,
    lastTx: v.last,
  }));
  return {
    address: address.toLowerCase(),
    family: "evm",
    activities,
    firstSeen: firstSeen || new Date().toISOString().slice(0, 10),
    activeMonths: months.size,
  };
}

async function alchemyLookup(address: string): Promise<LiveLookup> {
  const url = alchemyUrl()!;
  const price = await ethPriceUsd();
  const matched: MatchedTx[] = [];
  let pageKey: string | undefined;
  let pages = 0;
  let scanned = 0;
  let windowCapped = false;

  while (pages < ALCHEMY_PAGE_LIMIT) {
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "alchemy_getAssetTransfers",
      params: [
        {
          fromAddress: address,
          category: ["external", "erc20"],
          withMetadata: true,
          order: "asc",
          maxCount: "0x3e8",
          ...(pageKey ? { pageKey } : {}),
        },
      ],
    };
    const data = (await fetchJson(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })) as { result?: { transfers?: AlchemyTransfer[]; pageKey?: string }; error?: { message: string } };
    if (data.error) throw new Error(data.error.message);
    const transfers = data.result?.transfers ?? [];
    scanned += transfers.length;
    pages++;

    for (const t of transfers) {
      const to = t.to?.toLowerCase();
      if (!to) continue;
      const app = EVM_APP_BY_CONTRACT.get(to);
      if (!app) continue;
      const date = (t.metadata?.blockTimestamp ?? "").slice(0, 10);
      if (!date) continue;
      let usd = 0;
      if (t.category === "external" && t.value) usd = t.value * price;
      else if (t.category === "erc20" && t.value && t.asset && STABLECOINS.has(t.asset.toUpperCase()))
        usd = t.value;
      matched.push({ appId: app.id, hash: t.hash, date, usd });
    }

    pageKey = data.result?.pageKey;
    if (!pageKey) break;
    if (pages >= ALCHEMY_PAGE_LIMIT) windowCapped = true;
  }

  return {
    profile: buildProfileFromMatched(address, matched),
    matched,
    scannedTx: scanned,
    windowCapped,
    source: "alchemy",
  };
}

// ---------- Blockscout fallback (no API key) ----------

const BLOCKSCOUT = "https://eth.blockscout.com/api/v2";
const BS_PAGE_LIMIT = 5;

interface BsTx {
  hash: string;
  to: { hash: string } | null;
  value: string;
  timestamp: string;
  status: string;
}

async function blockscoutLookup(address: string): Promise<LiveLookup> {
  const addr = address.toLowerCase();
  const price = await ethPriceUsd();
  const matched: MatchedTx[] = [];
  let params = "";
  let pages = 0;
  let scanned = 0;
  let windowCapped = false;

  while (pages < BS_PAGE_LIMIT) {
    const data = (await fetchJson(`${BLOCKSCOUT}/addresses/${addr}/transactions?filter=from${params}`, {
      headers: { accept: "application/json" },
      next: { revalidate: 300 },
    } as RequestInit)) as { items?: BsTx[]; next_page_params?: Record<string, string | number> | null };
    const items = data.items ?? [];
    scanned += items.length;
    pages++;
    for (const tx of items) {
      const to = tx.to?.hash?.toLowerCase();
      if (!to || tx.status !== "ok") continue;
      const app = EVM_APP_BY_CONTRACT.get(to);
      if (!app) continue;
      matched.push({
        appId: app.id,
        hash: tx.hash,
        date: tx.timestamp.slice(0, 10),
        usd: (Number(tx.value) / 1e18) * price,
      });
    }
    if (!data.next_page_params) break;
    if (pages >= BS_PAGE_LIMIT) {
      windowCapped = true;
      break;
    }
    params =
      "&" +
      Object.entries(data.next_page_params)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join("&");
  }

  return {
    profile: buildProfileFromMatched(addr, matched),
    matched,
    scannedTx: scanned,
    windowCapped,
    source: "blockscout",
  };
}

/**
 * Live EVM lookup. With an Alchemy key, merges both sources by tx hash:
 * Alchemy contributes full-depth history and token-leg USD values;
 * Blockscout contributes recent zero-value contract calls (e.g. token-in
 * swaps) that transfer scanning can't see. Returns null only if every
 * source is unreachable.
 */
export async function fetchLiveEvmLookup(address: string): Promise<LiveLookup | null> {
  const addr = address.toLowerCase();
  if (!alchemyUrl()) {
    try {
      return await blockscoutLookup(addr);
    } catch (err) {
      console.error(`live: chain fetch failed for ${addr}:`, err);
      return null;
    }
  }

  const [a, b] = await Promise.allSettled([alchemyLookup(addr), blockscoutLookup(addr)]);
  const alchemy = a.status === "fulfilled" ? a.value : null;
  const blockscout = b.status === "fulfilled" ? b.value : null;
  if (!alchemy && !blockscout) {
    console.error(`live: all chain sources failed for ${addr}`);
    return null;
  }
  if (!alchemy) return blockscout;
  if (!blockscout) return alchemy;

  // Merge: key by hash+app; keep the record with the larger USD value.
  const merged = new Map<string, MatchedTx>();
  for (const m of [...alchemy.matched, ...blockscout.matched]) {
    const key = `${m.hash}:${m.appId}`;
    const cur = merged.get(key);
    if (!cur || m.usd > cur.usd) merged.set(key, m);
  }
  const matched = [...merged.values()].sort((x, y) => x.date.localeCompare(y.date));
  return {
    profile: buildProfileFromMatched(addr, matched),
    matched,
    scannedTx: alchemy.scannedTx + blockscout.scannedTx,
    windowCapped: alchemy.windowCapped,
    source: "alchemy",
  };
}

/**
 * KYC attestation check: looks for a Coinbase Verifications "Verified Account"
 * attestation on the address via EAS on Base. Fails open to "unverified".
 */
const EAS_BASE_GRAPHQL = "https://base.easscan.org/graphql";
const COINBASE_ATTESTER = "0x357458739F90461b99789350868CD7CF330Dd7EE";

export async function checkKycAttestation(
  address: string,
): Promise<{ verified: boolean; source: string }> {
  try {
    const res = await fetch(EAS_BASE_GRAPHQL, {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "content-type": "application/json" },
      next: { revalidate: 3600 },
      body: JSON.stringify({
        query: `query($r: String!, $a: String!) {
          attestations(where: { recipient: { equals: $r, mode: insensitive }, attester: { equals: $a }, revoked: { equals: false } }, take: 1) { id }
        }`,
        variables: { r: address, a: COINBASE_ATTESTER },
      }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { data?: { attestations?: { id: string }[] } };
    const verified = (data.data?.attestations?.length ?? 0) > 0;
    return {
      verified,
      source: verified
        ? "Coinbase Verifications attestation (EAS on Base)"
        : "No attestation found (checked Coinbase Verifications via EAS on Base)",
    };
  } catch {
    return { verified: false, source: "Attestation check unavailable — treated as unverified" };
  }
}
