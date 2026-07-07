import type { MonthlyScore } from "@/lib/wallets";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function label(month: string): string {
  return `${MONTH_NAMES[Number(month.slice(5, 7)) - 1]} ${month.slice(2, 4)}`;
}

/** Experian-style month-by-month score timeline: line chart + delta table. */
export default function ScoreHistory({ history }: { history: MonthlyScore[] }) {
  if (history.length < 2) return null;

  const w = 640;
  const h = 180;
  const pad = { top: 16, right: 16, bottom: 24, left: 40 };
  const min = Math.max(0, Math.min(...history.map((p) => p.score)) - 60);
  const max = Math.min(1000, Math.max(...history.map((p) => p.score)) + 60);
  const x = (i: number) => pad.left + (i * (w - pad.left - pad.right)) / (history.length - 1);
  const y = (s: number) => pad.top + (1 - (s - min) / (max - min)) * (h - pad.top - pad.bottom);
  const path = history.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");
  const ticks = [min, Math.round((min + max) / 2), max];
  const latest = history[history.length - 1];

  return (
    <section className="mt-10 rounded-xl border border-line bg-surface p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Score history</h2>
        <span className="text-xs text-faint">Month-end snapshots, reconstructed from full history</span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[480px]" role="img"
          aria-label={`Score by month, most recently ${latest.score} in ${label(latest.month)}`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={w - pad.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="1" />
              <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--faint)">{t}</text>
            </g>
          ))}
          <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
          {history.map((p, i) => (
            <g key={p.month}>
              <circle cx={x(i)} cy={y(p.score)} r="3.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
              <text x={x(i)} y={h - 6} textAnchor="middle" fontSize="10" fill="var(--faint)">{label(p.month)}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-faint border-b border-line">
              <th className="px-4 py-2.5">Month</th>
              <th className="px-4 py-2.5 text-right">Score</th>
              <th className="px-4 py-2.5 text-right">Grade</th>
              <th className="px-4 py-2.5 text-right">Change</th>
            </tr>
          </thead>
          <tbody>
            {[...history].reverse().map((p) => (
              <tr key={p.month} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5">{label(p.month)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums font-medium">{p.score}</td>
                <td className="px-4 py-2.5 text-right font-semibold" style={{ color: `var(--grade-${p.grade.toLowerCase()})` }}>{p.grade}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {p.delta === null ? (
                    <span className="text-faint">—</span>
                  ) : p.delta > 0 ? (
                    <span style={{ color: "var(--grade-a)" }}>▲ {p.delta}</span>
                  ) : p.delta < 0 ? (
                    <span style={{ color: "var(--grade-c)" }}>▼ {Math.abs(p.delta)}</span>
                  ) : (
                    <span className="text-faint">0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
