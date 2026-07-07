import GradeChip from "@/components/GradeChip";
import { APP_BY_ID } from "@/lib/apps";
import { fetchContractCounters } from "@/lib/counters";
import { networkStats } from "@/lib/wallets";
import type { Grade } from "@/lib/types";

export const metadata = { title: "Network — Cookie" };
export const revalidate = 3600;

export default async function NetworkPage() {
  const [stats, counters] = await Promise.all([
    Promise.resolve(networkStats()),
    fetchContractCounters(),
  ]);
  const grades: { g: Grade; count: number; blurb: string }[] = [
    { g: "A", count: stats.grades.A, blurb: "Top users — high depth, breadth, or volume" },
    { g: "B", count: stats.grades.B, blurb: "Average — established but not standout" },
    { g: "C", count: stats.grades.C, blurb: "Below average — light or new wallets" },
  ];
  const maxHist = Math.max(...stats.scoreHistogram.map((b) => b.count));
  const liveTotal = counters.reduce((s, c) => s + (c.txCount ?? 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <h1 className="text-3xl font-bold tracking-tight">Network overview</h1>

      {/* LIVE: real contract activity */}
      <section className="mt-8">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Tracked contract activity</h2>
          <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={{ borderColor: "var(--grade-a)", color: "var(--grade-a)" }}>
            ● Live
          </span>
        </div>
        <p className="mt-2 text-sm text-muted max-w-3xl">
          Real cumulative transaction totals for each tracked Ethereum entry-point contract (Blockscout, refreshed
          hourly): <strong className="text-foreground">{liveTotal.toLocaleString()}</strong> transactions across the
          set. Unique-wallet counts per app require the full indexer (in progress) — no public explorer exposes them.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-faint border-b border-line bg-surface">
                <th className="px-4 py-3">App</th>
                <th className="px-4 py-3">Chain</th>
                <th className="px-4 py-3">Entry-point contract</th>
                <th className="px-4 py-3 text-right">Total transactions (live)</th>
              </tr>
            </thead>
            <tbody>
              {[...counters]
                .sort((a, b) => (b.txCount ?? -1) - (a.txCount ?? -1))
                .map((c) => {
                  const app = APP_BY_ID.get(c.appId)!;
                  return (
                    <tr key={c.appId} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 font-medium">{app.name}</td>
                      <td className="px-4 py-3 text-muted">{app.chain}</td>
                      <td className="px-4 py-3 font-mono text-xs text-faint">{c.contract.slice(0, 10)}…{c.contract.slice(-6)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {c.txCount !== null ? c.txCount.toLocaleString() : <span className="text-faint font-normal">{c.note ?? "—"}</span>}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-faint">
          Primary entry points only — secondary routers (e.g. Uniswap V2/V3 routers, wstETH) are matched in wallet
          lookups but not totaled here. Solana program totals arrive with the Solana indexer.
        </p>
      </section>

      {/* DEMO: synthetic population */}
      <section className="mt-14">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Rating distribution</h2>
          <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-xs font-semibold text-faint">
            ○ Synthetic demo population
          </span>
        </div>
        <p className="mt-2 text-sm text-muted max-w-3xl">
          What the network will look like once the indexer rates the full wallet universe — illustrated with a
          deterministic synthetic population of {stats.population.toLocaleString()} wallets. These are NOT real
          wallet counts.
        </p>

        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Synthetic wallets", value: stats.population.toLocaleString() },
            { label: "Median score", value: String(stats.medianScore) },
            { label: "Full-stack (5+ apps)", value: stats.fullStackWallets.toLocaleString() },
            { label: "KYC-verified", value: stats.kycWallets.toLocaleString() },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-line bg-surface p-4">
              <div className="text-2xl font-bold tabular-nums">{s.value}</div>
              <div className="mt-1 text-xs text-faint">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
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
        </div>

        <div className="mt-6 rounded-xl border border-line bg-surface p-6">
          <h3 className="font-semibold">Score distribution</h3>
          <p className="mt-1 text-xs text-faint">Synthetic wallets per 100-point bucket · grade bands marked below</p>
          <div className="mt-6 flex items-end gap-[2px] h-44" role="img" aria-label="Histogram of wallet scores in 100-point buckets">
            {stats.scoreHistogram.map((b) => (
              <div key={b.bucket} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-[10px] text-faint tabular-nums mb-1">{b.count}</span>
                <div
                  className="w-full rounded-t"
                  style={{ height: `${Math.max(2, (b.count / maxHist) * 100)}%`, background: "var(--accent)" }}
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
        </div>
      </section>
    </div>
  );
}
