import GradeChip from "@/components/GradeChip";
import { APP_BY_ID } from "@/lib/apps";
import { networkStats } from "@/lib/wallets";
import type { Grade } from "@/lib/types";

export const metadata = { title: "Network — Cookie" };

export default function NetworkPage() {
  const stats = networkStats();
  const grades: { g: Grade; count: number; blurb: string }[] = [
    { g: "A", count: stats.grades.A, blurb: "Top users — high depth, breadth, or volume" },
    { g: "B", count: stats.grades.B, blurb: "Average — established but not standout" },
    { g: "C", count: stats.grades.C, blurb: "Below average — light or new wallets" },
  ];
  const maxHist = Math.max(...stats.scoreHistogram.map((b) => b.count));
  const maxAppVol = Math.max(...stats.perApp.map((a) => a.volumeUsd));

  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <h1 className="text-3xl font-bold tracking-tight">Network overview</h1>
      <p className="mt-2 text-sm text-muted max-w-2xl">
        The rated population across the launch app set. Demo tier: a deterministic synthetic population of{" "}
        {stats.population.toLocaleString()} wallets.
      </p>

      {/* Stat tiles */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Wallets rated", value: stats.population.toLocaleString() },
          { label: "Median score", value: String(stats.medianScore) },
          { label: "Full-stack wallets (all 5 apps)", value: stats.fullStackWallets.toLocaleString() },
          { label: "Total volume", value: `$${(stats.totalVolumeUsd / 1e9).toFixed(2)}B` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-surface p-4">
            <div className="text-2xl font-bold tabular-nums">{s.value}</div>
            <div className="mt-1 text-xs text-faint">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Grade distribution */}
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {grades.map(({ g, count, blurb }) => (
          <div key={g} className="rounded-xl border border-line bg-surface p-5 flex items-center gap-4">
            <GradeChip grade={g} size="lg" />
            <div>
              <div className="text-2xl font-bold tabular-nums">
                {count.toLocaleString()}
                <span className="ml-2 text-sm font-normal text-faint">
                  {((count / stats.population) * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted mt-1">{blurb}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Score histogram */}
      <section className="mt-10 rounded-xl border border-line bg-surface p-6">
        <h2 className="font-semibold">Score distribution</h2>
        <p className="mt-1 text-xs text-faint">Wallets per 100-point score bucket · grade bands marked below</p>
        <div className="mt-6 flex items-end gap-[2px] h-44" role="img" aria-label="Histogram of wallet scores in 100-point buckets">
          {stats.scoreHistogram.map((b) => (
            <div key={b.bucket} className="flex-1 flex flex-col items-center justify-end h-full">
              <span className="text-[10px] text-faint tabular-nums mb-1">{b.count}</span>
              <div
                className="w-full rounded-t"
                style={{
                  height: `${Math.max(2, (b.count / maxHist) * 100)}%`,
                  background: "var(--accent)",
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-[2px] text-[10px] text-faint tabular-nums">
          {stats.scoreHistogram.map((b) => (
            <span key={b.bucket} className="flex-1 text-center">{b.bucket}</span>
          ))}
        </div>
        <div className="mt-2 flex text-[10px] font-medium">
          <span className="text-center" style={{ width: "45%", color: "var(--grade-c)" }}>C · 0–449</span>
          <span className="text-center" style={{ width: "35%", color: "var(--grade-b)" }}>B · 450–799</span>
          <span className="text-center" style={{ width: "20%", color: "var(--grade-a)" }}>A · 800–1000</span>
        </div>
      </section>

      {/* Per-app table */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">Activity by launch app</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-faint border-b border-line bg-surface">
                <th className="px-4 py-3">App</th>
                <th className="px-4 py-3 text-right">Wallets</th>
                <th className="px-4 py-3 text-right">Transactions</th>
                <th className="px-4 py-3 text-right">Volume (USD)</th>
                <th className="px-4 py-3 w-1/4">Share of volume</th>
              </tr>
            </thead>
            <tbody>
              {[...stats.perApp]
                .sort((a, b) => b.volumeUsd - a.volumeUsd)
                .map((a) => (
                  <tr key={a.appId} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium">{APP_BY_ID.get(a.appId)?.name ?? a.appId}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{a.wallets.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{a.tx.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums">${(a.volumeUsd / 1e6).toFixed(1)}M</td>
                    <td className="px-4 py-3">
                      <div className="h-2 rounded-full bg-surface-2 border border-line overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(a.volumeUsd / maxAppVol) * 100}%`, background: "var(--accent)" }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
