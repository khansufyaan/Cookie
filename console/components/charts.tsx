"use client";

import { BAND_META, type Band, type PortfolioSummary, type Scored } from "@/lib/model";

const BANDS: Band[] = ["low", "elevated", "high", "blocked"];

export function fmtUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

/** Stacked score-distribution histogram, 20 buckets of 50 points. */
export function Histogram({ summary }: { summary: PortfolioSummary }) {
  const max = Math.max(1, ...summary.histogram.map((h) => BANDS.reduce((s, b) => s + h.counts[b], 0)));
  return (
    <div>
      <div className="flex h-40 items-end gap-[3px]">
        {summary.histogram.map((h) => {
          const total = BANDS.reduce((s, b) => s + h.counts[b], 0);
          return (
            <div key={h.bucket} className="group relative flex-1 flex flex-col-reverse" style={{ height: "100%" }}>
              {BANDS.map((b) =>
                h.counts[b] > 0 ? (
                  <div
                    key={b}
                    style={{
                      height: `${(h.counts[b] / max) * 100}%`,
                      background: BAND_META[b].color,
                      opacity: 0.92,
                    }}
                    className="w-full rounded-[1px]"
                  />
                ) : null,
              )}
              <div className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded border border-line-strong bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted group-hover:block z-10">
                {h.bucket}–{h.bucket + 49}: {total}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-faint tabular-nums">
        <span>0</span><span>250</span><span>500</span><span>750</span><span>1000</span>
      </div>
    </div>
  );
}

/** Risk-band share donut. */
export function Donut({ summary }: { summary: PortfolioSummary }) {
  const total = Math.max(1, summary.total);
  const R = 15.915; // circumference 100
  let offset = 25;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 42 42" className="h-32 w-32 shrink-0">
        <circle cx="21" cy="21" r={R} fill="none" stroke="var(--border)" strokeWidth="5" />
        {BANDS.map((b) => {
          const share = (summary.bands[b] / total) * 100;
          if (share <= 0) return null;
          const el = (
            <circle
              key={b}
              cx="21" cy="21" r={R} fill="none"
              stroke={BAND_META[b].color}
              strokeWidth="5"
              strokeDasharray={`${share} ${100 - share}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
            />
          );
          offset -= share;
          return el;
        })}
        <text x="21" y="20" textAnchor="middle" fill="var(--foreground)" fontSize="7" fontWeight="700">
          {Math.round(((summary.bands.low ?? 0) / total) * 100)}%
        </text>
        <text x="21" y="27" textAnchor="middle" fill="var(--faint)" fontSize="3.4">
          low risk
        </text>
      </svg>
      <div className="space-y-2">
        {BANDS.map((b) => (
          <div key={b} className="flex items-center gap-2.5 text-sm">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: BAND_META[b].color }} />
            <span className="text-muted w-20">{BAND_META[b].label}</span>
            <span className="font-semibold tabular-nums">{summary.bands[b].toLocaleString()}</span>
            <span className="text-xs text-faint tabular-nums">{Math.round((summary.bands[b] / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Volume (log) vs score scatter — where the money sits vs where the risk sits. */
export function Scatter({ scored }: { scored: Scored[] }) {
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
          r={2.1}
          fill={BAND_META[s.band].color}
          fillOpacity={0.75}
        />
      ))}
    </svg>
  );
}
