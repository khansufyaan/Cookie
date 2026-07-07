import Link from "next/link";
import GradeSeal from "@/components/GradeSeal";
import { studyCohort } from "@/lib/actions";
import { fetchContractCounters } from "@/lib/counters";
import type { Grade } from "@/lib/types";

export const metadata = { title: "Research — Halbrook" };
export const revalidate = 86400;
export const maxDuration = 60;

export default async function ResearchPage() {
  const [{ reports }, counters] = await Promise.all([studyCohort(12), fetchContractCounters()]);
  const liveTotal = counters.reduce((s, c) => s + (c.txCount ?? 0), 0);

  const n = reports.length;
  const grades: Record<Grade, number> = { A: 0, B: 0, C: 0 };
  let multiApp = 0;
  let kyc = 0;
  let totalVol = 0;
  const scores: number[] = [];
  for (const { report } of reports) {
    grades[report.result.grade]++;
    if (report.result.totals.appsUsed >= 2) multiApp++;
    if (report.result.kyc.verified) kyc++;
    totalVol += report.result.totals.volumeUsd;
    scores.push(report.result.score);
  }
  scores.sort((a, b) => a - b);
  const median = n ? scores[Math.floor(n / 2)] : 0;

  const quarter = "Q3 2026";

  return (
    <div className="mx-auto max-w-4xl px-5 pt-14">
      <p className="text-xs uppercase tracking-[0.25em] text-accent text-center">Halbrook Research</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-center">State of Wallet Credit</h1>
      <p className="mt-2 text-center text-muted">{quarter} · refreshed daily from live chain data</p>

      {/* Headline numbers */}
      <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Transactions tracked (live)", value: liveTotal.toLocaleString() },
          { label: "Cohort sampled this period", value: String(n) },
          { label: "Cohort median score", value: String(median) },
          { label: "Cohort volume", value: `$${Math.round(totalVol).toLocaleString()}` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-surface p-4">
            <div className="text-2xl font-bold tabular-nums">{s.value}</div>
            <div className="mt-1 text-xs text-faint">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Grade distribution of the cohort */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">Grade distribution — active-wallet cohort</h2>
        <p className="mt-2 text-sm text-muted max-w-2xl">
          A random cohort of wallets observed transacting with tracked contracts in the current window, each rated
          from its full on-chain history. Real wallets, real ratings; the full-universe distribution ships with the
          indexer.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {(["A", "B", "C"] as Grade[]).map((g) => (
            <div key={g} className="rounded-xl border border-line bg-surface p-5 flex items-center gap-4">
              <GradeSeal grade={g} size="sm" />
              <div>
                <div className="text-2xl font-bold tabular-nums">
                  {grades[g]}
                  <span className="ml-2 text-sm font-normal text-faint">{n ? Math.round((grades[g] / n) * 100) : 0}%</span>
                </div>
                <div className="text-xs text-faint">of sampled cohort</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Findings */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">Findings</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted leading-relaxed list-disc pl-5">
          <li>
            <strong className="text-foreground">{n ? Math.round((multiApp / n) * 100) : 0}% of the active cohort uses 2+ tracked apps.</strong>{" "}
            Cross-app breadth remains the scarcest — and therefore most predictive — factor in the rubric.
          </li>
          <li>
            <strong className="text-foreground">{kyc} of {n} sampled wallets carry a KYC attestation.</strong>{" "}
            On-chain identity is still early; wallets that claim it stand out to counterparties by construction.
          </li>
          <li>
            <strong className="text-foreground">The tracked contract set has processed {liveTotal.toLocaleString()} transactions.</strong>{" "}
            Coverage spans DEX, lending, staking, restaking, prediction markets, and yield across two chains.
          </li>
        </ul>
      </section>

      <section className="mt-12 mb-4 rounded-xl border border-line bg-surface p-6 text-center">
        <h2 className="font-semibold">Get the full report</h2>
        <p className="mt-2 text-sm text-muted max-w-md mx-auto">
          The complete quarterly — full-universe distributions, sector breakdowns, and rating-action statistics —
          publishes when the indexer completes its backfill.
        </p>
        <Link href="/network" className="mt-4 inline-block text-sm font-medium text-accent hover:text-accent-strong">
          Live network data →
        </Link>
      </section>
    </div>
  );
}
