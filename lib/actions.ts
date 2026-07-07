import { resolveWallet, type WalletReport } from "./wallets";

/**
 * Rating actions — the agency-style upgrades/downgrades feed, and the
 * research-report cohort. Wallets are sampled live from recent activity on
 * tracked contracts (real addresses, real ratings — nothing curated or
 * synthetic). Once the full indexer lands, this becomes a query over the
 * rated universe instead of a live sample.
 */

const BLOCKSCOUT = "https://eth.blockscout.com/api/v2";
const SAMPLE_CONTRACTS = [
  "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD", // Uniswap Universal Router
  "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", // Aave V3 Pool
  "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", // Lido stETH
];

/** Sample distinct wallets seen transacting with tracked contracts just now. */
export async function sampleActiveWallets(n: number): Promise<string[]> {
  const seen = new Set<string>();
  await Promise.allSettled(
    SAMPLE_CONTRACTS.map(async (c) => {
      const res = await fetch(`${BLOCKSCOUT}/addresses/${c}/transactions?filter=to`, {
        signal: AbortSignal.timeout(10000),
        headers: { accept: "application/json" },
        next: { revalidate: 1800 },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { items?: { from: { hash: string } }[] };
      for (const tx of data.items ?? []) {
        const from = tx.from?.hash?.toLowerCase();
        if (from) seen.add(from);
      }
    }),
  );
  return [...seen].slice(0, n);
}

export interface RatingAction {
  address: string;
  action: "Upgrade" | "Downgrade" | "Affirmed" | "Coverage initiated";
  grade: string;
  score: number;
  prevScore: number | null;
  delta: number | null;
  month: string;
}

export interface CohortStudy {
  reports: { address: string; report: WalletReport }[];
  actions: RatingAction[];
}

/** Resolve a live sample of wallets and derive rating actions from their timelines. */
export async function studyCohort(n: number): Promise<CohortStudy> {
  const addresses = await sampleActiveWallets(n);
  const settled = await Promise.allSettled(addresses.map((a) => resolveWallet(a)));

  const reports: { address: string; report: WalletReport }[] = [];
  settled.forEach((s, i) => {
    if (s.status === "fulfilled" && s.value.kind === "ok") {
      reports.push({ address: addresses[i], report: s.value.report });
    }
  });

  const actions: RatingAction[] = reports.map(({ address, report }) => {
    const h = report.history;
    const latest = h[h.length - 1];
    const prev = h.length >= 2 ? h[h.length - 2] : null;
    const grade = `${report.result.grade}${report.result.modifier}`;
    if (!latest || !prev) {
      return {
        address,
        action: "Coverage initiated",
        grade,
        score: report.result.score,
        prevScore: null,
        delta: null,
        month: latest?.month ?? new Date().toISOString().slice(0, 7),
      };
    }
    const delta = latest.score - prev.score;
    return {
      address,
      action: latest.grade > prev.grade ? "Downgrade" : latest.grade < prev.grade ? "Upgrade" : delta > 0 ? "Upgrade" : delta < 0 ? "Downgrade" : "Affirmed",
      grade,
      score: latest.score,
      prevScore: prev.score,
      delta,
      month: latest.month,
    };
  });

  // Most consequential first: grade moves, then big deltas.
  actions.sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0));
  return { reports, actions };
}
