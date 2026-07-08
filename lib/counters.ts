import { EVM_APPS } from "./apps";

/**
 * Live per-contract activity counters from Blockscout (Ethereum mainnet).
 * These are REAL cumulative totals for each tracked entry-point contract —
 * unlike the synthetic demo population, which is labeled as such.
 * Unique-wallet counts require the full indexer (they are not exposed by
 * public explorers); transaction totals are the honest live metric we have.
 */

const BLOCKSCOUT = "https://eth.blockscout.com/api/v2";
const TIMEOUT_MS = 8000;

export interface ContractCounter {
  appId: string;
  contract: string;
  txCount: number | null; // null = unavailable (non-Ethereum chain or fetch failed)
  note?: string;
}

export async function fetchContractCounters(): Promise<ContractCounter[]> {
  const results = await Promise.allSettled(
    EVM_APPS.map(async (app): Promise<ContractCounter> => {
      if (app.chain !== "Ethereum") {
        return {
          appId: app.id,
          contract: app.contract,
          txCount: null,
          note: `${app.chain} indexer pending`,
        };
      }
      const res = await fetch(`${BLOCKSCOUT}/addresses/${app.contract}/counters`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { accept: "application/json" },
        next: { revalidate: 3600 },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { transactions_count?: string };
      const n = Number(data.transactions_count);
      return {
        appId: app.id,
        contract: app.contract,
        txCount: Number.isFinite(n) ? n : null,
      };
    }),
  );
  return results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { appId: EVM_APPS[i].id, contract: EVM_APPS[i].contract, txCount: null, note: "fetch failed" },
  );
}
