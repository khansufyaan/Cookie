import { EVM_APP_BY_CONTRACT } from "./apps";
import type { AppActivity, WalletProfile } from "./types";

/**
 * Live tier: reads real chain data per lookup.
 *
 * - Transactions: Blockscout public API (Ethereum mainnet). We page through
 *   the wallet's most recent transactions (up to PAGE_LIMIT pages of 50) and
 *   keep those whose counterparty is a tracked launch-app contract.
 * - Coverage caveats (disclosed in the UI): recent-history window only;
 *   volume counts native ETH value (token-only swaps report $0 volume until
 *   the token-transfer indexer lands); Polygon (Polymarket) and Solana
 *   require their own indexer connections and are demo-only for now.
 */

const BLOCKSCOUT = "https://eth.blockscout.com/api/v2";
const PAGE_LIMIT = 5; // 5 x 50 = up to 250 most recent transactions scanned
const TIMEOUT_MS = 8000;

interface BsTx {
  hash: string;
  to: { hash: string } | null;
  value: string; // wei
  timestamp: string;
  status: string;
}

async function fetchJson(url: string, retries = 1): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { accept: "application/json" },
        next: { revalidate: 300 },
      });
      if (!res.ok) throw new Error(`${res.status} from ${url}`);
      return await res.json();
    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
}

async function ethPriceUsd(): Promise<number> {
  try {
    const stats = (await fetchJson(`${BLOCKSCOUT}/stats`)) as { coin_price?: string };
    const p = Number(stats.coin_price);
    return Number.isFinite(p) && p > 0 ? p : 0;
  } catch {
    return 0;
  }
}

export interface LiveLookup {
  profile: WalletProfile;
  scannedTx: number; // total transactions scanned in the window
  windowCapped: boolean; // true if the wallet has more history than we scanned
}

/**
 * Build a WalletProfile from real Ethereum mainnet history.
 * Returns null if the chain API is unreachable (caller falls back to demo).
 */
export async function fetchLiveEvmProfile(address: string): Promise<LiveLookup | null> {
  const addr = address.toLowerCase();
  try {
    const price = await ethPriceUsd();
    const txs: BsTx[] = [];
    let params = "";
    let pages = 0;
    let windowCapped = false;

    while (pages < PAGE_LIMIT) {
      const data = (await fetchJson(
        `${BLOCKSCOUT}/addresses/${addr}/transactions?filter=from${params}`,
      )) as { items?: BsTx[]; next_page_params?: Record<string, string | number> | null };
      txs.push(...(data.items ?? []));
      pages++;
      if (!data.next_page_params) break;
      if (pages >= PAGE_LIMIT) {
        windowCapped = true;
        break;
      }
      params =
        "&" +
        Object.entries(data.next_page_params)
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
          .join("&");
    }

    // Group by tracked contract.
    const byApp = new Map<string, { txCount: number; volumeUsd: number; first: string; last: string }>();
    const activeMonthSet = new Set<string>();
    let firstSeen = "";

    for (const tx of txs) {
      const to = tx.to?.hash?.toLowerCase();
      if (!to) continue;
      const app = EVM_APP_BY_CONTRACT.get(to);
      if (!app || tx.status !== "ok") continue;
      const date = tx.timestamp.slice(0, 10);
      const month = date.slice(0, 7);
      activeMonthSet.add(month);
      if (!firstSeen || date < firstSeen) firstSeen = date;
      const usd = (Number(tx.value) / 1e18) * price;
      const cur = byApp.get(app.id) ?? { txCount: 0, volumeUsd: 0, first: date, last: date };
      cur.txCount++;
      cur.volumeUsd += usd;
      if (date < cur.first) cur.first = date;
      if (date > cur.last) cur.last = date;
      byApp.set(app.id, cur);
    }

    const activities: AppActivity[] = [...byApp.entries()].map(([appId, v]) => ({
      appId,
      txCount: v.txCount,
      volumeUsd: Math.round(v.volumeUsd),
      firstTx: v.first,
      lastTx: v.last,
    }));

    return {
      profile: {
        address: addr,
        family: "evm",
        activities,
        firstSeen: firstSeen || new Date().toISOString().slice(0, 10),
        activeMonths: activeMonthSet.size,
      },
      scannedTx: txs.length,
      windowCapped,
    };
  } catch (err) {
    console.error(`live: chain fetch failed for ${addr}:`, err);
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
