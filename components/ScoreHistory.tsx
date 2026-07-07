"use client";

import { useMemo, useRef, useState } from "react";
import type { MonthlyScore } from "@/lib/wallets";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function label(month: string): string {
  return `${MONTH_NAMES[Number(month.slice(5, 7)) - 1]} ${month.slice(2, 4)}`;
}

function longLabel(month: string): string {
  return `${MONTH_NAMES[Number(month.slice(5, 7)) - 1]} 20${month.slice(2, 4)}`;
}

/** Nice y-axis bounds and ticks for a 0-1000 score domain. */
function niceScale(lo: number, hi: number): { lo: number; hi: number; ticks: number[] } {
  const span = Math.max(60, hi - lo);
  const step = span <= 120 ? 25 : span <= 250 ? 50 : span <= 500 ? 100 : 200;
  const nLo = Math.max(0, Math.floor((lo - step * 0.4) / step) * step);
  const nHi = Math.min(1000, Math.ceil((hi + step * 0.4) / step) * step);
  const ticks = [];
  for (let t = nLo; t <= nHi; t += step) ticks.push(t);
  return { lo: nLo, hi: nHi, ticks };
}

const W = 760;
const H = 320;
const PAD = { top: 24, right: 24, bottom: 40, left: 52 };

/** Month-by-month score timeline: interactive line chart + delta table. */
export default function ScoreHistory({ history }: { history: MonthlyScore[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const geom = useMemo(() => {
    if (history.length < 2) return null;
    const scores = history.map((p) => p.score);
    const { lo, hi, ticks } = niceScale(Math.min(...scores), Math.max(...scores));
    const x = (i: number) => PAD.left + (i * (W - PAD.left - PAD.right)) / (history.length - 1);
    const y = (s: number) => PAD.top + (1 - (s - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom);
    const line = history.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");
    const area = `${line} L${x(history.length - 1).toFixed(1)},${(H - PAD.bottom).toFixed(1)} L${PAD.left},${(H - PAD.bottom).toFixed(1)} Z`;
    return { lo, hi, ticks, x, y, line, area };
  }, [history]);

  if (!geom || history.length < 2) return null;
  const { ticks, x, y, line, area } = geom;
  const last = history.length - 1;
  const active = hover ?? last;
  const pt = history[active];

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.left) / (W - PAD.left - PAD.right)) * (history.length - 1));
    setHover(Math.max(0, Math.min(history.length - 1, i)));
  }

  return (
    <section className="mt-10 rounded-xl border border-line bg-surface p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold text-lg">Score history</h2>
        <span className="text-xs text-faint">Month-end snapshots · reconstructed from full history</span>
      </div>

      {/* Readout row — updates on hover */}
      <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <span className="text-3xl font-bold tabular-nums">{pt.score}</span>
        <span className="text-sm text-muted">{longLabel(pt.month)}</span>
        {pt.delta !== null && pt.delta !== 0 && (
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: pt.delta > 0 ? "var(--grade-a)" : "var(--grade-c)" }}
          >
            {pt.delta > 0 ? "▲" : "▼"} {Math.abs(pt.delta)} vs prior month
          </span>
        )}
        <span className="ml-auto text-xs text-faint tabular-nums">
          12-mo range {Math.min(...history.map((p) => p.score))}–{Math.max(...history.map((p) => p.score))}
        </span>
      </div>

      <div className="mt-3 overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[560px] cursor-crosshair"
          role="img"
          aria-label={`Score by month, most recently ${history[last].score} in ${longLabel(history[last].month)}`}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.14" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Gridlines + y labels */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="1" />
              <text x={PAD.left - 10} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--faint)" fontVariant="tabular-nums">
                {t}
              </text>
            </g>
          ))}
          {/* Baseline */}
          <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="var(--border-strong)" strokeWidth="1" />

          {/* Area + line */}
          <path d={area} fill="url(#scoreFill)" />
          <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

          {/* Crosshair */}
          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="3 3" />
          )}

          {/* Points: subtle all, emphasized active + endpoint */}
          {history.map((p, i) => (
            <circle
              key={p.month}
              cx={x(i)}
              cy={y(p.score)}
              r={i === active || i === last ? 4.5 : 2.5}
              fill={i === active ? "var(--accent)" : "var(--surface)"}
              stroke="var(--accent)"
              strokeWidth="2"
            />
          ))}

          {/* X labels */}
          {history.map((p, i) => (
            <text key={p.month} x={x(i)} y={H - 12} textAnchor="middle" fontSize="11" fill={i === active ? "var(--foreground)" : "var(--faint)"}>
              {label(p.month)}
            </text>
          ))}
        </svg>
      </div>

      {/* Delta table */}
      <div className="mt-5 overflow-x-auto rounded-lg border border-line">
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
              <tr key={p.month} className="border-b border-line last:border-0 hover:bg-surface-2 transition-colors">
                <td className="px-4 py-2.5">{longLabel(p.month)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums font-medium">{p.score}</td>
                <td className="px-4 py-2.5 text-right font-semibold" style={{ color: `var(--grade-${p.grade.toLowerCase()})` }}>
                  {p.grade}
                </td>
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
