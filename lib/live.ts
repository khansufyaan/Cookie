import { EVM_APP_BY_CONTRACT, SOL_APPS } from "./apps";
import type { AppActivity, ChainFamily, WalletProfile } from "./types";

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
  source: "alchemy" | "blockscout" | "helius";
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
  family: ChainFamily = "evm",
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
    address: family === "evm" ? address.toLowerCase() : address,
    family,
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

// ---------- Solana (Helius parsed-transaction API) ----------

const HELIUS_PAGE_LIMIT = 5; // 5 x 100 parsed transactions
const SOL_STABLE_MINTS = new Map([
  ["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "USDC"],
  ["Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", "USDT"],
]);
const SOL_PROGRAM_TO_APP = new Map(SOL_APPS.map((a) => [a.contract, a]));

async function solPriceUsd(): Promise<number> {
  try {
    const data = (await fetchJson(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      { headers: { accept: "application/json" }, next: { revalidate: 300 } } as RequestInit,
    )) as { solana?: { usd?: number } };
    return data.solana?.usd ?? 0;
  } catch {
    return 0;
  }
}

interface HeliusTx {
  signature: string;
  timestamp: number;
  feePayer: string;
  instructions?: { programId: string; innerInstructions?: { programId: string }[] }[];
  nativeTransfers?: { fromUserAccount: string; amount: number }[];
  tokenTransfers?: { fromUserAccount: string; mint: string; tokenAmount: number }[];
}

/** Live Solana lookup via Helius. Returns null if unreachable or no key. */
export async function fetchLiveSolLookup(address: string): Promise<LiveLookup | null> {
  const key = process.env.HELIUS_API_KEY;
  if (!key) return null;
  try {
    const price = await solPriceUsd();
    const matched: MatchedTx[] = [];
    let before = "";
    let pages = 0;
    let scanned = 0;
    let windowCapped = false;

    while (pages < HELIUS_PAGE_LIMIT) {
      const url = `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${key}&limit=100${before}`;
      const txs = (await fetchJson(url, { headers: { accept: "application/json" } })) as HeliusTx[];
      if (!Array.isArray(txs) || txs.length === 0) break;
      scanned += txs.length;
      pages++;

      for (const tx of txs) {
        if (tx.feePayer !== address) continue; // only wallet-initiated activity
        const programs = new Set<string>();
        for (const ins of tx.instructions ?? []) {
          programs.add(ins.programId);
          for (const inner of ins.innerInstructions ?? []) programs.add(inner.programId);
        }
        const apps = [...programs]
          .map((p) => SOL_PROGRAM_TO_APP.get(p))
          .filter((a): a is NonNullable<typeof a> => Boolean(a));
        if (apps.length === 0) continue;

        const date = new Date(tx.timestamp * 1000).toISOString().slice(0, 10);
        let usd = 0;
        for (const nt of tx.nativeTransfers ?? []) {
          if (nt.fromUserAccount === address) usd += (nt.amount / 1e9) * price;
        }
        for (const tt of tx.tokenTransfers ?? []) {
          if (tt.fromUserAccount === address && SOL_STABLE_MINTS.has(tt.mint)) usd += tt.tokenAmount;
        }
        // A tx can touch multiple tracked programs (e.g. Jupiter routing
        // through Raydium); credit each, but attach volume once.
        apps.forEach((app, i) => {
          matched.push({ appId: app.id, hash: tx.signature, date, usd: i === 0 ? usd : 0 });
        });
      }

      if (txs.length < 100) break;
      before = `&before=${txs[txs.length - 1].signature}`;
      if (pages >= HELIUS_PAGE_LIMIT) windowCapped = true;
    }

    return {
      profile: buildProfileFromMatched(address, matched, undefined, "solana"),
      matched,
      scannedTx: scanned,
      windowCapped,
      source: "helius",
    };
  } catch (err) {
    console.error(`live: solana fetch failed for ${address}:`, err);
    return null;
  }
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
