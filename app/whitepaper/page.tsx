import { fetchContractCounters } from "@/lib/counters";
import { universeStats } from "@/lib/indexer";
import { validationStats } from "@/lib/validation";
import type { Grade } from "@/lib/types";

export const metadata = { title: "Whitepaper — Visa Wallet Rating" };
export const revalidate = 86400;

const GRADES: Grade[] = ["A", "B", "C"];

export default async function WhitepaperPage() {
  const [counters, universe, validation] = await Promise.all([
    fetchContractCounters(),
    universeStats().catch(() => null),
    validationStats().catch(() => null),
  ]);
  const liveTotal = counters.reduce((s, c) => s + (c.txCount ?? 0), 0);

  return (
    <div className="mx-auto max-w-3xl px-5 pt-16 pb-8">
      <p className="text-xs uppercase tracking-[0.25em] text-accent">Visa Wallet Rating Whitepaper · v1 · July 2026</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">The Wallet Rating Score: a credit rating for wallets</h1>
      <p className="mt-4 text-muted leading-relaxed">
        Visa Wallet Rating rates crypto wallets A, B, or C from their complete on-chain history across the highest-volume
        applications on Ethereum and Solana. This paper describes the methodology, the data infrastructure, the
        compliance layer, and — unusually for this category — publishes live validation statistics computed from the
        rated universe itself.
      </p>

      <Section title="1 · The problem">
        <p>
          On-chain activity is public but illegible. An application deciding whether a wallet is a valuable user, a
          lender assessing a counterparty, or a compliance desk screening a customer each face the same raw
          material — millions of undifferentiated transactions — and each rebuilds the same analysis from scratch.
          Traditional finance solved this with the credit bureau: one institution turns scattered records into a
          single, portable, contestable score. Crypto has no equivalent with adoption.
        </p>
      </Section>

      <Section title="2 · Methodology: the Wallet Rating Score">
        <p>
          Every score derives from a wallet&apos;s transactions with the <strong>tracked set</strong>: the top-10
          applications by volume on each chain (Ethereum: Uniswap, Aave, Lido, Morpho, Curve, 1inch, Polymarket,
          Ethena, EigenLayer, Pendle · Solana: Jupiter, Raydium, Orca, Pump.fun, PumpSwap, Meteora, Kamino, Drift,
          Jito, Marinade), recalibrated quarterly.
        </p>
        <p className="mt-3">Five factors are normalized against network calibration curves and weighted into a 0–1000 score:</p>
        <ul className="mt-2 space-y-1 list-disc pl-5">
          <li><strong>Consistency (15%)</strong> — share of months active since first seen.</li>
          <li><strong>Reach (20%)</strong> — breadth across the tracked set; the primary sybil-resistance signal.</li>
          <li><strong>Usage (25%)</strong> — transaction count, log-calibrated.</li>
          <li><strong>Magnitude (25%)</strong> — USD volume, log-calibrated; deliberately equal-weighted with Usage so high-value/low-frequency and high-frequency/low-value wallets both have a path to the top grade.</li>
          <li><strong>Bedrock (15%)</strong> — tenure plus average ticket size.</li>
        </ul>
        <p className="mt-3">
          Grade bands: <strong>A ≥ 800</strong> (calibrated to roughly the top decile), <strong>B ≥ 450</strong>,{" "}
          <strong>C below</strong>, with +/− modifiers at band edges. Bonuses (+50 breadth, +50 verified identity)
          are capped so the score never exceeds 1000. Because scores are pure functions of cumulative history, the
          engine reconstructs any wallet&apos;s score at any past month-end — enabling both the score timelines shown
          on every report and the validation statistics below.
        </p>
      </Section>

      <Section title="3 · Data infrastructure">
        <p>
          Ratings are computed from primary sources at request time: full outgoing transfer history (Alchemy;
          Blockscout fallback) matched against tracked entry-point contracts on Ethereum, and parsed transaction
          history (Helius) matched against tracked program IDs on Solana. The tracked contracts have processed{" "}
          <strong className="tabular-nums">{liveTotal.toLocaleString()}</strong> cumulative transactions. In
          parallel, an indexer walks every transfer into the tracked contracts from genesis, discovering and rating
          the full wallet universe
          {universe ? (
            <>
              {" "}— <strong className="tabular-nums">{universe.discovered.toLocaleString()}</strong> wallets
              discovered and <strong className="tabular-nums">{universe.rated.toLocaleString()}</strong> fully rated
              at publication time, growing continuously
            </>
          ) : null}
          .
        </p>
      </Section>

      <Section title="4 · Validation — live, from the rated universe">
        {validation && validation.n >= 30 ? (
          <>
            <p>
              The exhibits below are computed from the {validation.n.toLocaleString()} rated wallets with at least
              six months of score history (of {validation.nTotal.toLocaleString()} rated to date), comparing each
              wallet&apos;s grade in {validation.baselineMonth} against {validation.asOfMonth}. They regenerate daily
              as the universe grows — this page always shows current sample sizes rather than a frozen favorable
              snapshot.
            </p>
            <h3 className="mt-6 font-semibold text-sm">4.1 Grade transition matrix ({validation.baselineMonth} → {validation.asOfMonth})</h3>
            <div className="mt-3 overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-faint border-b border-line bg-surface">
                    <th className="px-4 py-2.5 text-left">From \ To</th>
                    {GRADES.map((g) => <th key={g} className="px-4 py-2.5 text-right">{g}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {GRADES.map((from) => {
                    const row = validation.transition[from];
                    const total = GRADES.reduce((s, g) => s + row[g], 0);
                    return (
                      <tr key={from} className="border-b border-line last:border-0">
                        <td className="px-4 py-2.5 font-semibold" style={{ color: `var(--grade-${from.toLowerCase()})` }}>{from}</td>
                        {GRADES.map((to) => (
                          <td key={to} className="px-4 py-2.5 text-right tabular-nums">
                            {total > 0 ? `${Math.round((row[to] / total) * 100)}%` : "—"}
                            <span className="text-faint text-xs ml-1">({row[to]})</span>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <h3 className="mt-6 font-semibold text-sm">4.2 Activity persistence by baseline grade</h3>
            <p className="mt-2">Share of wallets whose score moved in the trailing quarter (i.e., still active), by grade six months ago:</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {validation.persistence.map((p) => (
                <div key={p.grade} className="rounded-lg border border-line bg-surface p-4">
                  <div className="text-sm font-bold" style={{ color: `var(--grade-${p.grade.toLowerCase()})` }}>Grade {p.grade}</div>
                  <div className="mt-1 text-2xl font-bold tabular-nums">{p.total > 0 ? `${p.activePct}%` : "—"}</div>
                  <div className="text-xs text-faint">active · n={p.total}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p>
            Validation exhibits publish automatically once the rated universe with six months of history reaches a
            minimum sample (n ≥ 30). Current progress:{" "}
            <strong className="tabular-nums">{validation?.nTotal?.toLocaleString() ?? "0"}</strong> wallets rated,{" "}
            <strong className="tabular-nums">{validation?.n?.toLocaleString() ?? "0"}</strong> with sufficient
            history. This section intentionally shows nothing rather than synthetic numbers.
          </p>
        )}
      </Section>

      <Section title="5 · Identity, sanctions, and contestability">
        <p>
          Identity changes the tier, not the math: a KYC attestation (Coinbase Verifications, verified live via EAS
          on Base) yields the Verified tier — Prime when combined with grade A. Every lookup and every ingest batch
          is screened against the OFAC SDN digital-currency list; matches are suppressed to a Restricted tier with
          an explicit flag. Ratings are contestable through a published dispute process — acknowledgment within two
          business days, re-run against source data, outcome with reasoning. Visa Wallet Rating computes from public data,
          mints credentials only with the owner&apos;s signature, and is not a consumer reporting agency.
        </p>
      </Section>

      <Section title="6 · Roadmap">
        <ul className="space-y-1 list-disc pl-5">
          <li>Owner-claimed soulbound credentials (EAS on Base) with revoke-and-reissue portability.</li>
          <li>Merkle epoch commitments: one on-chain transaction per month committing the entire rated universe, making any rating verifiable on-chain without per-wallet minting.</li>
          <li>Base and Arbitrum coverage; token-level USD valuation beyond majors.</li>
          <li>Grade-change webhooks and watchlist alerts.</li>
        </ul>
      </Section>

      <p className="mt-10 text-xs text-faint">
        Figures regenerate daily from live data. Ratings are informational and are not financial advice or a
        consumer credit report. © 2026 Visa Wallet Rating.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 text-sm text-muted leading-relaxed">{children}</div>
    </section>
  );
}
