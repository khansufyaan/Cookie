"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BAND_META, DEFAULT_LEVERS, bandMovement, explainRow, scorePortfolio, summarize,
  type Band, type Levers, type Scored, type WalletRow,
} from "@/lib/model";
import { useLevers } from "@/lib/useLevers";
import type { TimelineMonth } from "@/app/api/timeline/route";
import { Donut, Histogram, Scatter, Sparkline, Timeline, fmtUsd } from "./charts";

interface Watchlist { id: number; name: string; wallet_count: number }
type Filter = { kind: "bucket"; bucket: number } | { kind: "band"; band: Band } | null;

/* Okabe-Ito–based colorblind-safe alternative to the default red/amber/green. */
const CB_SAFE = { low: "#0072B2", elevated: "#E69F00", high: "#CC79A7", blocked: "#8b96ab" };
const DEFAULT_RISK = { low: "#2fbf7f", elevated: "#f0b429", high: "#f4604d", blocked: "#a63232" };

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <div className="text-xl font-bold tabular-nums transition-all" style={accent ? { color: accent } : undefined}>{value}</div>
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

function exportCsv(scored: Scored[], levers: Levers) {
  const head = "address,model_score,band,baseline_score,tx_count,volume_usd,apps_used,kyc_verified,sanctioned,archetype";
  const rows = scored.map((s) =>
    [
      s.row.address, s.score, s.band, s.row.baselineScore, s.row.txCount,
      s.row.volumeUsd, s.row.appsUsed, s.row.kycVerified, s.row.sanctioned,
      JSON.stringify(s.row.archetype ?? ""),
    ].join(","),
  );
  const csv = `# Visa Risk Console export · model=${JSON.stringify(JSON.stringify(levers))}\n${head}\n${rows.join("\n")}`;
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `risk-portfolio-${scored.length}-wallets.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------- Wallet drill-down slide-over ---------- */

function WalletPanel({
  scored, levers, onClose,
}: {
  scored: Scored;
  levers: Levers;
  onClose: () => void;
}) {
  const [history, setHistory] = useState<{ month: string; score: number }[]>([]);
  const exp = useMemo(() => explainRow(scored.row, levers), [scored.row, levers]);

  useEffect(() => {
    fetch(`/api/wallet/${scored.row.address}`)
      .then((r) => r.json())
      .then((j) => setHistory(j.data ?? []))
      .catch(() => {});
  }, [scored.row.address]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label="Wallet breakdown">
      <button className="flex-1 bg-black/50" onClick={onClose} aria-label="Close" />
      <div className="h-full w-full max-w-md overflow-y-auto border-l border-line-strong bg-surface p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted break-all">{scored.row.address}</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl font-bold tabular-nums">{exp.score}</span>
              <span
                className="rounded px-2 py-0.5 text-xs font-semibold"
                style={{ color: BAND_META[exp.band].color, border: `1px solid ${BAND_META[exp.band].color}` }}
              >
                {BAND_META[exp.band].label}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-faint">
              Production baseline: {scored.row.baselineScore} · {scored.row.archetype ?? "—"}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-line-strong px-2.5 py-1 text-sm text-muted hover:border-accent">✕</button>
        </div>

        {history.length > 1 && (
          <div className="mt-5 rounded-lg border border-line bg-surface-2 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">Score trajectory (production engine)</p>
            <div className="mt-2"><Sparkline points={history} /></div>
            <div className="mt-1 flex justify-between text-[10px] text-faint">
              <span>{history[0].month}</span><span>{history[history.length - 1].month}</span>
            </div>
          </div>
        )}

        <h3 className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-faint">Factor contributions under your model</h3>
        <div className="mt-3 space-y-3">
          {exp.factors.map((f) => (
            <div key={f.key}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{f.label}</span>
                <span className="font-mono text-xs tabular-nums text-muted">+{f.points} pts</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${f.raw * 100}%`, background: "var(--accent)" }} />
              </div>
              <p className="mt-0.5 text-[11px] text-faint">{f.detail}</p>
            </div>
          ))}
        </div>

        {exp.adjustments.length > 0 && (
          <>
            <h3 className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-faint">Adjustments</h3>
            <div className="mt-2 space-y-1.5">
              {exp.adjustments.map((a) => (
                <div key={a.label} className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm">
                  <span className="text-muted">{a.label}</span>
                  <span
                    className="font-mono text-xs font-semibold tabular-nums"
                    style={{ color: a.points >= 0 ? "var(--risk-low)" : "var(--risk-high)" }}
                  >
                    {a.points >= 0 ? "+" : ""}{a.points} pts
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2 text-center">
          {[
            { l: "Transactions", v: scored.row.txCount.toLocaleString() },
            { l: "Volume", v: fmtUsd(scored.row.volumeUsd) },
            { l: "Apps used", v: String(scored.row.appsUsed) },
            { l: "KYC", v: scored.row.kycVerified ? "Verified" : "—" },
          ].map((x) => (
            <div key={x.l} className="rounded-lg border border-line bg-surface-2 px-2 py-2.5">
              <div className="text-sm font-bold tabular-nums">{x.v}</div>
              <div className="text-[10px] text-faint">{x.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Main dashboard ---------- */

export default function Dashboard() {
  const [rows, setRows] = useState<WalletRow[]>([]);
  const [source, setSource] = useState<"live" | "demo" | "loading">("loading");
  const { levers, loadedModel } = useLevers();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [watchlist, setWatchlist] = useState<string>("all");
  const [months, setMonths] = useState<TimelineMonth[]>([]);
  const [filter, setFilter] = useState<Filter>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [cbSafe, setCbSafe] = useState(false);

  /* Colorblind-safe palette: swap the CSS custom properties so every chart,
     chip, and threshold bar re-colors at once. Persisted per analyst. */
  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("vrc-cb-safe") === "1";
    if (saved) setCbSafe(true);
  }, []);
  useEffect(() => {
    const pal = cbSafe ? CB_SAFE : DEFAULT_RISK;
    const root = document.documentElement;
    root.style.setProperty("--risk-low", pal.low);
    root.style.setProperty("--risk-elevated", pal.elevated);
    root.style.setProperty("--risk-high", pal.high);
    root.style.setProperty("--risk-blocked", pal.blocked);
    localStorage.setItem("vrc-cb-safe", cbSafe ? "1" : "0");
  }, [cbSafe]);

  useEffect(() => {
    fetch("/api/watchlists").then((r) => r.json()).then((j) => setWatchlists(j.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    setSource("loading");
    setFilter(null);
    fetch(`/api/portfolio?watchlist=${watchlist}`)
      .then((r) => r.json())
      .then((j) => {
        setRows(j.data ?? []);
        setSource(j.meta?.source === "live" ? "live" : "demo");
      })
      .catch(() => setSource("demo"));
    fetch(`/api/timeline?watchlist=${watchlist}`)
      .then((r) => r.json())
      .then((j) => setMonths(j.data ?? []))
      .catch(() => setMonths([]));
  }, [watchlist]);

  const scored = useMemo(() => scorePortfolio(rows, levers), [rows, levers]);
  const baselineScored = useMemo(() => scorePortfolio(rows, DEFAULT_LEVERS), [rows]);
  const summary = useMemo(() => summarize(scored), [scored]);
  const baselineSummary = useMemo(() => summarize(baselineScored), [baselineScored]);
  const movement = useMemo(() => bandMovement(scored, baselineScored), [scored, baselineScored]);

  const filtered = useMemo(() => {
    if (!filter) return null;
    const list =
      filter.kind === "bucket"
        ? scored.filter((s) => s.score >= filter.bucket && s.score < filter.bucket + 50)
        : scored.filter((s) => s.band === filter.band);
    return [...list].sort((a, b) => b.row.volumeUsd - a.row.volumeUsd).slice(0, 200);
  }, [filter, scored]);

  const riskiest = useMemo(
    () =>
      [...scored]
        .filter((s) => s.band === "high" || s.band === "blocked")
        .sort((a, b) => b.row.volumeUsd - a.row.volumeUsd)
        .slice(0, 12),
    [scored],
  );

  const detailScored = useMemo(
    () => (detail ? scored.find((s) => s.row.address === detail) ?? null : null),
    [detail, scored],
  );

  const openWallet = useCallback((address: string) => setDetail(address), []);

  const filterLabel =
    filter?.kind === "bucket"
      ? `scores ${filter.bucket}–${filter.bucket + 49}`
      : filter?.kind === "band"
        ? BAND_META[filter.band].label
        : null;

  return (
    <div className="flex">
      <div className="min-w-0 flex-1 px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Portfolio risk</h1>
            <p className="mt-0.5 text-xs text-faint">
              Observed on-chain metrics, scored by <span className="text-muted">your</span> model.
              {loadedModel && <span className="ml-1 text-accent-strong">Loaded: {loadedModel}</span>}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-faint">
              <span className="rounded border border-line-strong px-1.5 py-0.5 tabular-nums">temp {levers.temperature.toFixed(2)}</span>
              <span className="rounded border border-line-strong px-1.5 py-0.5 tabular-nums">
                w {levers.wActivity}/{levers.wVolume}/{levers.wBreadth}/{levers.wTicket}
              </span>
              <span className="rounded border border-line-strong px-1.5 py-0.5 tabular-nums">
                bands {levers.elevatedMin}·{levers.lowMin}
              </span>
              <Link href="/" className="rounded bg-accent px-2 py-0.5 font-semibold text-white hover:bg-accent-strong transition-colors">
                Adjust model →
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {movement.moved > 0 && (
              <span className="rounded-full border border-line-strong px-3 py-1 text-[11px] text-muted tabular-nums">
                vs baseline: <span style={{ color: "var(--risk-low)" }}>▲{movement.up}</span>{" "}
                <span style={{ color: "var(--risk-high)" }}>▼{movement.down}</span> moved band
              </span>
            )}
            <button
              onClick={() => setCbSafe((v) => !v)}
              className="rounded-full border border-line-strong px-3 py-1 text-[11px] font-medium text-muted hover:border-accent hover:text-accent-strong transition-colors"
              title="Toggle a colorblind-safe risk palette"
              aria-pressed={cbSafe}
            >
              {cbSafe ? "◑ CB-safe palette on" : "◑ CB-safe palette"}
            </button>
            <button
              onClick={() => exportCsv(scored, levers)}
              disabled={scored.length === 0}
              className="rounded-full bg-accent px-3.5 py-1 text-[11px] font-semibold text-white hover:bg-accent-strong transition-colors disabled:opacity-50"
            >
              ↓ Export CSV
            </button>
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
                <option key={w.id} value={String(w.id)}>{w.name} ({w.wallet_count})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <Kpi label="Monitored wallets" value={summary.total.toLocaleString()} />
          <Kpi label="Median score" value={String(summary.medianScore)} />
          <Kpi label="Low risk" value={`${summary.total ? Math.round((summary.bands.low / summary.total) * 100) : 0}%`} accent="var(--risk-low)" />
          <Kpi label="High risk" value={summary.bands.high.toLocaleString()} accent="var(--risk-high)" />
          <Kpi label="Sanctioned" value={summary.sanctionedCount.toLocaleString()} accent="var(--risk-blocked)" />
          <Kpi label="Portfolio volume" value={fmtUsd(summary.totalVolumeUsd)} />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <Card title="Score distribution" right={<span className="text-[11px] text-faint">click a column to inspect</span>}>
              <Histogram
                summary={summary}
                baseline={baselineSummary}
                selected={filter?.kind === "bucket" ? filter.bucket : null}
                onSelect={(b) => setFilter(b === null ? null : { kind: "bucket", bucket: b })}
              />
            </Card>
          </div>
          <div className="xl:col-span-2">
            <Card title="Risk bands" right={<span className="text-[11px] text-faint">click a band to filter</span>}>
              <Donut
                summary={summary}
                selected={filter?.kind === "band" ? filter.band : null}
                onSelect={(b) => setFilter(b === null ? null : { kind: "band", band: b })}
              />
              <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-faint">
                KYC-verified: <span className="text-muted">{Math.round(summary.kycShare * 100)}%</span> · Mean score:{" "}
                <span className="text-muted">{summary.meanScore}</span>
              </p>
            </Card>
          </div>
        </div>

        {/* Drill-down table appears when a bucket or band is selected */}
        {filtered && (
          <div className="mt-4">
            <Card
              title={`Wallets in ${filterLabel}`}
              right={
                <button onClick={() => setFilter(null)} className="text-[11px] font-medium text-accent-strong hover:underline">
                  Clear filter ✕
                </button>
              }
            >
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-surface">
                    <tr className="text-left text-[10px] uppercase tracking-wider text-faint">
                      <th className="px-2 py-1.5">Wallet</th>
                      <th className="px-2 py-1.5 text-right">Model score</th>
                      <th className="px-2 py-1.5 text-right">Baseline</th>
                      <th className="px-2 py-1.5 text-right">Volume</th>
                      <th className="px-2 py-1.5 text-right">Apps</th>
                      <th className="px-2 py-1.5 text-right">Band</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr
                        key={s.row.address}
                        onClick={() => openWallet(s.row.address)}
                        className="cursor-pointer border-t border-line transition-colors hover:bg-surface-2"
                      >
                        <td className="px-2 py-1.5 font-mono text-[11px] text-muted">{s.row.address.slice(0, 10)}…{s.row.address.slice(-4)}</td>
                        <td className="px-2 py-1.5 text-right font-semibold tabular-nums">{s.score}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-faint">{s.row.baselineScore}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-muted">{fmtUsd(s.row.volumeUsd)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-muted">{s.row.appsUsed}</td>
                        <td className="px-2 py-1.5 text-right">
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ color: BAND_META[s.band].color, border: `1px solid ${BAND_META[s.band].color}` }}>
                            {BAND_META[s.band].label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[10px] text-faint">Click a row for the factor-by-factor breakdown. Showing top {filtered.length} by volume.</p>
            </Card>
          </div>
        )}

        <div className="mt-4 grid gap-4 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <Card title="Volume vs score" right={<span className="text-[11px] text-faint">click a dot for its breakdown</span>}>
              <Scatter scored={scored} onSelect={openWallet} />
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
                      <tr key={s.row.address} onClick={() => openWallet(s.row.address)} className="cursor-pointer border-t border-line transition-colors hover:bg-surface-2">
                        <td className="px-2 py-1.5 font-mono text-[11px] text-muted">{s.row.address.slice(0, 8)}…{s.row.address.slice(-4)}</td>
                        <td className="px-2 py-1.5 text-right font-semibold tabular-nums">{s.score}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-muted">{fmtUsd(s.row.volumeUsd)}</td>
                        <td className="px-2 py-1.5 text-right">
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ color: BAND_META[s.band].color, border: `1px solid ${BAND_META[s.band].color}` }}>
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

        <div className="mt-4">
          <Card title="Band migration over time" right={<span className="text-[11px] text-faint">is the portfolio drifting toward risk?</span>}>
            <Timeline months={months} levers={levers} />
          </Card>
        </div>
      </div>

      {detailScored && <WalletPanel scored={detailScored} levers={levers} onClose={() => setDetail(null)} />}
    </div>
  );
}
