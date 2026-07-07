import Link from "next/link";
import { studyCohort } from "@/lib/actions";

export const metadata = { title: "Rating actions — Halbrook" };
export const revalidate = 3600;
export const maxDuration = 60;

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const label = (m: string) => `${MONTH_NAMES[Number(m.slice(5, 7)) - 1]} 20${m.slice(2, 4)}`;

const ACTION_STYLE: Record<string, { color: string; symbol: string }> = {
  Upgrade: { color: "var(--grade-a)", symbol: "▲" },
  Downgrade: { color: "var(--grade-c)", symbol: "▼" },
  Affirmed: { color: "var(--muted)", symbol: "•" },
  "Coverage initiated": { color: "var(--accent)", symbol: "+" },
};

export default async function ActionsPage() {
  const { actions } = await studyCohort(10);

  return (
    <div className="mx-auto max-w-5xl px-5 pt-10">
      <h1 className="text-3xl font-bold tracking-tight">Rating actions</h1>
      <p className="mt-2 text-sm text-muted max-w-2xl">
        Upgrades, downgrades, affirmations, and coverage initiations — derived live from the month-end score
        timelines of wallets sampled from current activity on tracked contracts. Refreshed hourly.
      </p>

      <div className="mt-8 overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-faint border-b border-line bg-surface">
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Wallet</th>
              <th className="px-4 py-3 text-right">Rating</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3 text-right">Change</th>
              <th className="px-4 py-3 text-right">Period</th>
            </tr>
          </thead>
          <tbody>
            {actions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Sampling in progress — refresh in a moment.
                </td>
              </tr>
            )}
            {actions.map((a) => {
              const s = ACTION_STYLE[a.action];
              return (
                <tr key={a.address} className="border-b border-line last:border-0 hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3 font-semibold whitespace-nowrap" style={{ color: s.color }}>
                    {s.symbol} {a.action}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/wallet/${a.address}`} className="font-mono text-xs text-accent hover:text-accent-strong">
                      {a.address.slice(0, 10)}…{a.address.slice(-6)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-bold" style={{ color: `var(--grade-${a.grade[0].toLowerCase()})` }}>
                    {a.grade}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{a.score}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {a.delta === null ? (
                      <span className="text-faint">new</span>
                    ) : a.delta === 0 ? (
                      <span className="text-faint">0</span>
                    ) : (
                      <span style={{ color: a.delta > 0 ? "var(--grade-a)" : "var(--grade-c)" }}>
                        {a.delta > 0 ? "+" : ""}{a.delta}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-muted whitespace-nowrap">{label(a.month)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-faint">
        Sample-based while the full indexer is in progress — production publishes actions across the entire rated
        universe, with subscription alerts for watched wallets.
      </p>
    </div>
  );
}
