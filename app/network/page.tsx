import AppLogo from "@/components/AppLogo";
import GradeSeal from "@/components/GradeSeal";
import { APP_BY_ID, EVM_APPS, SOL_APPS } from "@/lib/apps";
import { fetchContractCounters } from "@/lib/counters";
import { universeStats } from "@/lib/indexer";
import type { Grade } from "@/lib/types";

export const metadata = { title: "Network — Visa Wallet Rating" };
export const revalidate = 1800;

export default async function NetworkPage() {
  const [counters, universe] = await Promise.all([
    fetchContractCounters(),
    universeStats().catch(() => null),
  ]);
  const liveTotal = counters.reduce((s, c) => s + (c.txCount ?? 0), 0);
  const ratedTotal = universe ? universe.grades.A + universe.grades.B + universe.grades.C : 0;

  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <h1 className="text-3xl font-bold tracking-tight">Network</h1>
      <p className="mt-2 text-sm text-muted max-w-2xl">
        The rating universe: wallets interacting with the top-10 apps by volume on each chain. All figures below are
        live chain data — nothing is estimated or synthesized.
      </p>

      <section className="mt-8">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Tracked contract activity</h2>
          <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={{ borderColor: "var(--grade-a)", color: "var(--grade-a)" }}>
            ● Live
          </span>
        </div>
        <p className="mt-2 text-sm text-muted max-w-3xl">
          Cumulative transactions per tracked Ethereum entry-point contract (refreshed hourly):{" "}
          <strong className="text-foreground tabular-nums">{liveTotal.toLocaleString()}</strong> across the set.
          Unique-wallet counts arrive with the full indexer.
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
                      <td className="px-4 py-3 font-medium">
                        <span className="flex items-center gap-2.5">
                          <AppLogo domain={app.domain} name={app.name} size={20} />
                          {app.name}
                        </span>
                      </td>
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
          Primary entry points only — secondary routers (Uniswap V2/V3 routers, wstETH, 1inch v6) are matched in
          wallet lookups but not totaled here.
        </p>
      </section>

      {/* Rated universe — from the indexer DB */}
      {universe && universe.discovered > 0 && (
        <section className="mt-14">
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-semibold tracking-tight">Rated universe</h2>
            <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={{ borderColor: "var(--grade-a)", color: "var(--grade-a)" }}>
              ● Live · growing
            </span>
          </div>
          <p className="mt-2 text-sm text-muted max-w-3xl">
            The indexer is walking every transfer into the tracked contracts from genesis, discovering each wallet
            and rating it with the same engine behind every lookup. These numbers grow continuously.
          </p>
          <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Wallets discovered", value: universe.discovered.toLocaleString() },
              { label: "Wallets rated", value: universe.rated.toLocaleString() },
              { label: "Rating queue", value: universe.pending.toLocaleString() },
              { label: "Median score (rated)", value: universe.medianScore !== null ? String(universe.medianScore) : "—" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-line bg-surface p-4">
                <div className="text-2xl font-bold tabular-nums">{s.value}</div>
                <div className="mt-1 text-xs text-faint">{s.label}</div>
              </div>
            ))}
          </div>
          {ratedTotal > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {(["A", "B", "C"] as Grade[]).map((g) => (
                <div key={g} className="rounded-xl border border-line bg-surface p-4 flex items-center gap-4">
                  <GradeSeal grade={g} size="sm" />
                  <div>
                    <div className="text-xl font-bold tabular-nums">
                      {universe.grades[g].toLocaleString()}
                      <span className="ml-2 text-sm font-normal text-faint">
                        {Math.round((universe.grades[g] / ratedTotal) * 100)}%
                      </span>
                    </div>
                    <div className="text-xs text-faint">of rated wallets</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight">Tracked app set — top 10 by volume, per chain</h2>
        <p className="mt-2 text-sm text-muted max-w-2xl">Recalibrated quarterly by volume.</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {[
            { title: "Ethereum + EVM", apps: EVM_APPS },
            { title: "Solana (indexer in progress)", apps: SOL_APPS },
          ].map(({ title, apps }) => (
            <div key={title} className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-faint border-b border-line bg-surface">
                    <th className="px-4 py-3">{title}</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Contract / Program</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => (
                    <tr key={a.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                        <span className="flex items-center gap-2.5">
                          <AppLogo domain={a.domain} name={a.name} size={18} />
                          {a.name}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted whitespace-nowrap">{a.category}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-faint truncate max-w-[12rem]" title={a.contract}>
                        {a.contract.slice(0, 10)}…{a.contract.slice(-6)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
