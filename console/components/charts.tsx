"use client";

import { BAND_META, type Band, type Levers, type PortfolioSummary, type Scored } from "@/lib/model";
import type { TimelineMonth } from "@/app/api/timeline/route";

const BANDS: Band[] = ["low", "elevated", "high", "blocked"];

export function fmtUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

/**
 * Stacked score-distribution histogram — 20 buckets of 50 points.
 * Bars animate as levers move; a hollow ghost bar behind each column shows
 * the production-baseline distribution so cause-and-effect is visible.
 * Click a column to drill into that score range.
 */
export function Histogram({
  summary, baseline, onSelect, selected, height = 160,
}: {
  summary: PortfolioSummary;
  baseline: PortfolioSummary;
  onSelect?: (bucket: number | null) => void;
  selected?: number | null;
  height?: number;
}) {
  const max = Math.max(
    1,
    ...summary.histogram.map((h) => BANDS.reduce((s, b) => s + h.counts[b], 0)),
    ...baseline.histogram.map((h) => BANDS.reduce((s, b) => s + h.counts[b], 0)),
  );
  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height: `${height}px` }}>
        {summary.histogram.map((h, i) => {
          const total = BANDS.reduce((s, b) => s + h.counts[b], 0);
          const ghost = BANDS.reduce((s, b) => s + baseline.histogram[i].counts[b], 0);
          const isSel = selected === h.bucket;
          return (
            <button
              key={h.bucket}
              onClick={() => onSelect?.(isSel ? null : h.bucket)}
              className="group relative flex-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]"
              style={{ height: "100%", background: isSel ? "rgba(64,102,255,0.10)" : undefined }}
              aria-label={`Scores ${h.bucket}–${h.bucket + 49}: ${total} wallets`}
            >
              {/* Baseline ghost — hollow outline at the reference height */}
              <div
                className="pointer-events-none absolute inset-x-[15%] rounded-t-[2px] border border-b-0 transition-all duration-300"
                style={{ bottom: 0, height: `${(ghost / max) * 100}%`, borderColor: "var(--border-strong)" }}
              />
              {/* Live stacked bar */}
              <div className="absolute inset-x-0 bottom-0 flex flex-col-reverse">
                {BANDS.map((b) => (
                  <div
                    key={b}
                    className="w-full transition-all duration-300 ease-out"
                    style={{
                      height: `${(h.counts[b] / max) * height}px`,
                      background: BAND_META[b].color,
                      opacity: 0.92,
                    }}
                  />
                ))}
              </div>
              <div className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded border border-line-strong bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted group-hover:block">
                {h.bucket}–{h.bucket + 49}: {total} <span className="text-faint">(was {ghost})</span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-faint tabular-nums">
        <span>0</span><span>250</span><span>500</span><span>750</span><span>1000</span>
      </div>
      <p className="mt-1 text-[10px] text-faint">
        Hollow outline = production baseline · click a column to inspect those wallets
      </p>
    </div>
  );
}

/** Risk-band share donut. Click a band to filter the wallet list. */
export function Donut({
  summary, onSelect, selected, size = 128,
}: {
  summary: PortfolioSummary;
  onSelect?: (band: Band | null) => void;
  selected?: Band | null;
  size?: number;
}) {
  const total = Math.max(1, summary.total);
  const R = 15.915;
  let offset = 25;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 42 42" className="shrink-0" style={{ width: size, height: size }}>
        <circle cx="21" cy="21" r={R} fill="none" stroke="var(--border)" strokeWidth="5" />
        {BANDS.map((b) => {
          const share = (summary.bands[b] / total) * 100;
          if (share <= 0) return null;
          const el = (
            <circle
              key={b}
              cx="21" cy="21" r={R} fill="none"
              stroke={BAND_META[b].color}
              strokeWidth={selected === b ? 6.5 : 5}
              strokeDasharray={`${share} ${100 - share}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              className="transition-all duration-300"
            />
          );
          offset -= share;
          return el;
        })}
        <text x="21" y="20" textAnchor="middle" fill="var(--foreground)" fontSize="7" fontWeight="700">
          {Math.round(((summary.bands.low ?? 0) / total) * 100)}%
        </text>
        <text x="21" y="27" textAnchor="middle" fill="var(--faint)" fontSize="3.4">low risk</text>
      </svg>
      <div className="space-y-1">
        {BANDS.map((b) => (
          <button
            key={b}
            onClick={() => onSelect?.(selected === b ? null : b)}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-sm outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]"
            style={selected === b ? { background: "var(--surface-2)" } : undefined}
          >
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: BAND_META[b].color }} />
            <span className="w-20 text-left text-muted">{BAND_META[b].label}</span>
            <span className="font-semibold tabular-nums">{summary.bands[b].toLocaleString()}</span>
            <span className="text-xs text-faint tabular-nums">{Math.round((summary.bands[b] / total) * 100)}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Volume (log) vs score scatter. Click a dot to open the wallet breakdown. */
export function Scatter({
  scored, onSelect,
}: {
  scored: Scored[];
  onSelect?: (address: string) => void;
}) {
  const W = 560;
  const H = 190;
  const PAD = { l: 44, r: 8, t: 8, b: 22 };
  const pts = scored.filter((s) => s.row.volumeUsd > 0);
  const maxLog = Math.max(1, ...pts.map((s) => Math.log10(s.row.volumeUsd)));
  const minLog = Math.min(maxLog - 0.5, ...pts.map((s) => Math.log10(Math.max(1, s.row.volumeUsd))));
  const x = (v: number) => PAD.l + ((Math.log10(Math.max(1, v)) - minLog) / (maxLog - minLog)) * (W - PAD.l - PAD.r);
  const y = (score: number) => PAD.t + (1 - score / 1000) * (H - PAD.t - PAD.b);
  const sample = pts.length > 1500 ? pts.filter((_, i) => i % Math.ceil(pts.length / 1500) === 0) : pts;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 250, 500, 750, 1000].map((s) => (
        <g key={s}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(s)} y2={y(s)} stroke="var(--border)" strokeWidth="1" />
          <text x={PAD.l - 6} y={y(s) + 3} textAnchor="end" fontSize="9" fill="var(--faint)">{s}</text>
        </g>
      ))}
      {[3, 5, 7, 9].map((e) =>
        Math.pow(10, e) <= Math.pow(10, maxLog) ? (
          <text key={e} x={x(Math.pow(10, e))} y={H - 8} textAnchor="middle" fontSize="9" fill="var(--faint)">
            {fmtUsd(Math.pow(10, e))}
          </text>
        ) : null,
      )}
      {sample.map((s) => (
        <circle
          key={s.row.address}
          cx={x(s.row.volumeUsd)}
          cy={y(s.score)}
          r={2.4}
          fill={BAND_META[s.band].color}
          fillOpacity={0.78}
          className="cursor-pointer transition-all duration-300 hover:stroke-white"
          strokeWidth={1}
          onClick={() => onSelect?.(s.row.address)}
        >
          <title>{s.row.address} — score {s.score}</title>
        </circle>
      ))}
    </svg>
  );
}

/**
 * Band migration over time — each month's stored score distribution split by
 * the analyst's CURRENT thresholds, as 100%-stacked columns. Answers "is the
 * portfolio drifting toward or away from my risk zone?"
 */
export function Timeline({ months, levers }: { months: TimelineMonth[]; levers: Levers }) {
  if (months.length === 0) {
    return <p className="py-8 text-center text-xs text-faint">No monthly history yet for this selection.</p>;
  }
  const bandOf = (bucketMid: number): Band =>
    bucketMid >= levers.lowMin ? "low" : bucketMid >= levers.elevatedMin ? "elevated" : "high";

  return (
    <div>
      <div className="flex h-36 items-end gap-1.5">
        {months.map((m) => {
          const counts: Record<Band, number> = { low: 0, elevated: 0, high: 0, blocked: 0 };
          m.buckets.forEach((n, i) => { counts[bandOf(i * 50 + 25)] += n; });
          const total = Math.max(1, m.total);
          return (
            <div key={m.month} className="group relative flex-1">
              <div className="flex h-36 flex-col-reverse overflow-hidden rounded-[3px]">
                {(["high", "elevated", "low"] as Band[]).map((b) => (
                  <div
                    key={b}
                    className="w-full transition-all duration-300"
                    style={{ height: `${(counts[b] / total) * 100}%`, background: BAND_META[b].color, opacity: 0.9 }}
                  />
                ))}
              </div>
              <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded border border-line-strong bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted group-hover:block">
                {m.month}: {Math.round((counts.low / total) * 100)}% low · {Math.round((counts.high / total) * 100)}% high
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-faint tabular-nums">
        <span>{months[0].month}</span>
        <span>{months[months.length - 1].month}</span>
      </div>
      <p className="mt-1 text-[10px] text-faint">
        Month-end production scores, split by your current band thresholds — move the thresholds and history re-colors.
      </p>
    </div>
  );
}

/** Tiny score sparkline for the wallet drill-down panel. */
export function Sparkline({ points }: { points: { month: string; score: number }[] }) {
  if (points.length < 2) return null;
  const W = 220;
  const H = 44;
  const xs = (i: number) => (i / (points.length - 1)) * (W - 4) + 2;
  const ys = (s: number) => H - 4 - (s / 1000) * (H - 8);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${xs(i).toFixed(1)},${ys(p.score).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <path d={d} fill="none" stroke="var(--accent-strong)" strokeWidth="1.6" />
      <circle cx={xs(points.length - 1)} cy={ys(points[points.length - 1].score)} r="2.4" fill="var(--accent-strong)" />
    </svg>
  );
}
