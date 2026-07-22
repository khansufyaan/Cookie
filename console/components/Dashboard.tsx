"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BAND_META, DEFAULT_LEVERS, bandMovement, scorePortfolio, summarize,
  type Levers, type WalletRow,
} from "@/lib/model";
import { Donut, Histogram, Scatter, fmtUsd } from "./charts";
import LeversPanel from "./LeversPanel";

interface Watchlist { id: number; name: string; wallet_count: number }

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <div className="text-xl font-bold tabular-nums" style={accent ? { color: accent } : undefined}>{value}</div>
      <div className="mt-0.5 text-[11px] text-faint">{label}</div>
    </div>
  );
}

function Card({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [rows, setRows] = useState<WalletRow[]>([]);
  const [source, setSource] = useState<"live" | "demo" | "loading">("loading");
  const [levers, setLevers] = useState<Levers>({ ...DEFAULT_LEVERS });
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [watchlist, setWatchlist] = useState<string>("all");

  useEffect(() => {
    fetch("/api/watchlists").then((r) => r.json()).then((j) => setWatchlists(j.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    setSource("loading");
    fetch(`/api/portfolio?watchlist=${watchlist}`)
      .then((r) => r.json())
      .then((j) => {
        setRows(j.data ?? []);
        setSource(j.meta?.source === "live" ? "live" : "demo");
      })
      .catch(() => setSource("demo"));
  }, [watchlist]);

  const scored = useMemo(() => scorePortfolio(rows, levers), [rows, levers]);
  const baseline = useMemo(() => scorePortfolio(rows, DEFAULT_LEVERS), [rows]);
  const summary = useMemo(() => summarize(scored), [scored]);
  const movement = useMemo(() => bandMovement(scored, baseline), [scored, baseline]);

  const riskiest = useMemo(
    () =>
      [...scored]
        .filter((s) => s.band === "high" || s.band === "blocked")
        .sort((a, b) => b.row.volumeUsd - a.row.volumeUsd)
        .slice(0, 12),
    [scored],
  );

  return (
    <div className="flex">
      {/* Main column */}
      <div className="min-w-0 flex-1 px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Portfolio risk</h1>
            <p className="mt-0.5 text-xs text-faint">
              Observed on-chain metrics, scored by <span className="text-muted">your</span> model.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {movement.moved > 0 && (
              <span className="rounded-full border border-line-strong px-3 py-1 text-[11px] text-muted tabular-nums">
                vs baseline: <span style={{ color: "var(--risk-low)" }}>▲{movement.up}</span>{" "}
                <span style={{ color: "var(--risk-high)" }}>▼{movement.down}</span> moved band
              </span>
            )}
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={
                source === "live"
                  ? { color: "var(--risk-low)", border: "1px solid var(--risk-low)" }
                  : { color: "var(--risk-elevated)", border: "1px solid var(--risk-elevated)" }
              }
            >
              {source === "loading" ? "Loading…" : source === "live" ? "● Live data" : "Demo data"}
            </span>
            <select
              value={watchlist}
              onChange={(e) => setWatchlist(e.target.value)}
              className="rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
            >
              <option value="all">All monitored wallets</option>
              {watchlists.map((w) => (
                <option key={w.id} value={String(w.id)}>
                  {w.name} ({w.wallet_count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <Kpi label="Monitored wallets" value={summary.total.toLocaleString()} />
          <Kpi label="Median score" value={String(summary.medianScore)} />
          <Kpi
            label="Low risk"
            value={`${summary.total ? Math.round((summary.bands.low / summary.total) * 100) : 0}%`}
            accent="var(--risk-low)"
          />
          <Kpi
            label="High risk"
            value={summary.bands.high.toLocaleString()}
            accent="var(--risk-high)"
          />
          <Kpi label="Sanctioned" value={summary.sanctionedCount.toLocaleString()} accent="var(--risk-blocked)" />
          <Kpi label="Portfolio volume" value={fmtUsd(summary.totalVolumeUsd)} />
        </div>

        {/* Charts */}
        <div className="mt-4 grid gap-4 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <Card title="Score distribution" right={<span className="text-[11px] text-faint">buckets of 50 · colored by your bands</span>}>
              <Histogram summary={summary} />
            </Card>
          </div>
          <div className="xl:col-span-2">
            <Card title="Risk bands">
              <Donut summary={summary} />
              <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-faint">
                KYC-verified: <span className="text-muted">{Math.round(summary.kycShare * 100)}%</span> · Mean score:{" "}
                <span className="text-muted">{summary.meanScore}</span>
              </p>
            </Card>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <Card title="Volume vs score" right={<span className="text-[11px] text-faint">is big money sitting in risky wallets?</span>}>
              <Scatter scored={scored} />
            </Card>
          </div>
          <div className="xl:col-span-2">
            <Card title="Largest wallets in your risk zone" right={<span className="text-[11px] text-faint">by volume</span>}>
              <div className="-mx-2 max-h-[230px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-surface">
                    <tr className="text-left text-[10px] uppercase tracking-wider text-faint">
                      <th className="px-2 py-1.5">Wallet</th>
                      <th className="px-2 py-1.5 text-right">Score</th>
                      <th className="px-2 py-1.5 text-right">Volume</th>
                      <th className="px-2 py-1.5 text-right">Band</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskiest.length === 0 && (
                      <tr><td colSpan={4} className="px-2 py-6 text-center text-faint">No wallets in the high-risk band under this model.</td></tr>
                    )}
                    {riskiest.map((s) => (
                      <tr key={s.row.address} className="border-t border-line">
                        <td className="px-2 py-1.5 font-mono text-[11px] text-muted">
                          {s.row.address.slice(0, 8)}…{s.row.address.slice(-4)}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums font-semibold">{s.score}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-muted">{fmtUsd(s.row.volumeUsd)}</td>
                        <td className="px-2 py-1.5 text-right">
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                            style={{ color: BAND_META[s.band].color, border: `1px solid ${BAND_META[s.band].color}` }}
                          >
                            {BAND_META[s.band].label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Levers rail */}
      <aside className="sticky top-0 h-screen w-72 shrink-0 overflow-y-auto border-l border-line bg-surface px-5 py-6">
        <LeversPanel levers={levers} onChange={setLevers} />
      </aside>
    </div>
  );
}
