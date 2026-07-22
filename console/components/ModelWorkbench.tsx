"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LEVERS, PRESETS, bandMovement, scorePortfolio, summarize,
  type Levers, type WalletRow,
} from "@/lib/model";
import { useLevers } from "@/lib/useLevers";
import { Donut, Histogram } from "./charts";
import { SavedModels } from "./LeversPanel";

/* Apple-esque: one idea per row, ≤8 words of copy, generous whitespace,
   value as the hero, everything advanced folded away. */

function Row({
  label, hint, value, min, max, step = 1, unit, onChange, format,
}: {
  label: string;
  hint: string; // ≤ 8 words
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className="px-6 py-5">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-[15px] font-semibold">{label}</div>
          <div className="mt-0.5 text-xs text-faint">{hint}</div>
        </div>
        <div className="text-xl font-bold tabular-nums text-foreground">
          {format ? format(value) : value}
          {unit && <span className="ml-1 text-xs font-medium text-faint">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3.5"
        aria-label={label}
      />
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      {sub && <p className="mt-0.5 text-sm text-faint">{sub}</p>}
      <div className="mt-3 divide-y divide-[var(--border)] rounded-2xl bg-surface">{children}</div>
    </section>
  );
}

const fmtK = (v: number) => (v >= 1_000_000 ? `${v / 1_000_000}M` : v >= 1000 ? `${v / 1000}k` : String(v));

export default function ModelWorkbench() {
  const { levers, setLevers, loadedModel } = useLevers();
  const [rows, setRows] = useState<WalletRow[]>([]);
  const set = (patch: Partial<Levers>) => setLevers({ ...levers, ...patch });

  useEffect(() => {
    fetch("/api/portfolio?watchlist=all")
      .then((r) => r.json())
      .then((j) => setRows(j.data ?? []))
      .catch(() => {});
  }, []);

  const scored = useMemo(() => scorePortfolio(rows, levers), [rows, levers]);
  const baseline = useMemo(() => scorePortfolio(rows, DEFAULT_LEVERS), [rows]);
  const summary = useMemo(() => summarize(scored), [scored]);
  const baselineSummary = useMemo(() => summarize(baseline), [baseline]);
  const movement = useMemo(() => bandMovement(scored, baseline), [scored, baseline]);

  const activePreset = PRESETS.find((p) => JSON.stringify(p.levers) === JSON.stringify(levers))?.name;

  return (
    <div className="flex">
      <div className="min-w-0 flex-1 px-8 py-8">
        <div className="max-w-xl">
          <h1 className="text-3xl font-bold tracking-tight">Your risk model.</h1>
          <p className="mt-1.5 text-sm text-muted">
            Move a lever, watch every wallet re-score. No opinions — just yours.
            {loadedModel && <span className="ml-1 text-accent-strong">Loaded: {loadedModel}</span>}
          </p>

          {/* Segmented presets */}
          <div className="mt-5 inline-flex rounded-xl bg-surface p-1">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => setLevers({ ...p.levers })}
                title={p.note}
                className="rounded-lg px-4 py-1.5 text-xs font-semibold transition-all"
                style={
                  activePreset === p.name
                    ? { background: "var(--accent)", color: "#fff" }
                    : { color: "var(--muted)" }
                }
              >
                {p.name.replace("Production baseline", "Baseline")}
              </button>
            ))}
          </div>

          <Section title="What counts" sub="Four ingredients. You set the mix.">
            <Row label="Activity" hint="How often it transacts." value={levers.wActivity} min={0} max={100} onChange={(v) => set({ wActivity: v })} />
            <Row label="Volume" hint="Total dollars ever moved." value={levers.wVolume} min={0} max={100} onChange={(v) => set({ wVolume: v })} />
            <Row label="Breadth" hint="How many apps it uses." value={levers.wBreadth} min={0} max={100} onChange={(v) => set({ wBreadth: v })} />
            <Row label="Ticket size" hint="Average dollars per transaction." value={levers.wTicket} min={0} max={100} onChange={(v) => set({ wTicket: v })} />
          </Section>

          <Section title="Strictness" sub="How tough the grader is.">
            <div className="px-6 py-5">
              <div className="flex items-baseline justify-between">
                <div className="text-[15px] font-semibold">Temperature</div>
                <div className="text-xl font-bold tabular-nums">{levers.temperature.toFixed(2)}</div>
              </div>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.05}
                value={levers.temperature}
                onChange={(e) => set({ temperature: Number(e.target.value) })}
                className="mt-3.5"
                aria-label="Temperature"
              />
              <div className="mt-2 flex justify-between text-[11px] text-faint">
                <span>Lenient</span><span>Neutral</span><span>Strict</span>
              </div>
            </div>
          </Section>

          <Section title="Your risk lines" sub="Everything above the line is fine by you.">
            <Row label="Low risk starts at" hint="Scores here and up are safe." value={levers.lowMin} min={levers.elevatedMin + 50} max={950} step={10} onChange={(v) => set({ lowMin: v })} />
            <Row label="Elevated starts at" hint="Below this is high risk." value={levers.elevatedMin} min={50} max={levers.lowMin - 50} step={10} onChange={(v) => set({ elevatedMin: v })} />
            <div className="px-6 py-5">
              <div className="flex overflow-hidden rounded-lg text-center text-[11px] font-semibold text-white">
                <div style={{ width: `${(levers.elevatedMin / 1000) * 100}%`, background: "var(--risk-high)" }} className="py-1.5 transition-all duration-300">High</div>
                <div style={{ width: `${((levers.lowMin - levers.elevatedMin) / 1000) * 100}%`, background: "var(--risk-elevated)" }} className="py-1.5 transition-all duration-300">Elevated</div>
                <div style={{ width: `${((1000 - levers.lowMin) / 1000) * 100}%`, background: "var(--risk-low)" }} className="py-1.5 transition-all duration-300">Low</div>
              </div>
            </div>
          </Section>

          {/* Everything else lives behind one calm disclosure */}
          <details className="group mt-8">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl bg-surface px-6 py-4 [&::-webkit-details-marker]:hidden">
              <div>
                <span className="text-lg font-bold tracking-tight">Fine-tuning</span>
                <p className="mt-0.5 text-sm text-faint">Ceilings, bonuses, penalties, sanctions.</p>
              </div>
              <span className="text-faint transition-transform group-open:rotate-90">›</span>
            </summary>

            <div className="mt-3 space-y-6">
              <div>
                <p className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-faint">Full credit at</p>
                <div className="mt-2 divide-y divide-[var(--border)] rounded-2xl bg-surface">
                  <Row label="Activity ceiling" hint="More transactions than this add nothing." value={levers.activityCeil} min={100} max={10000} step={100} onChange={(v) => set({ activityCeil: v })} format={fmtK} unit="txs" />
                  <Row label="Volume ceiling" hint="More dollars than this add nothing." value={levers.volumeCeil} min={100_000} max={50_000_000} step={100_000} onChange={(v) => set({ volumeCeil: v })} format={(v) => `$${fmtK(v)}`} />
                  <Row label="Breadth saturation" hint="Apps needed for full credit." value={levers.breadthSat} min={2} max={10} onChange={(v) => set({ breadthSat: v })} unit="apps" />
                  <Row label="Ticket ceiling" hint="Average ticket for full credit." value={levers.ticketCeil} min={1000} max={250_000} step={1000} onChange={(v) => set({ ticketCeil: v })} format={(v) => `$${fmtK(v)}`} />
                </div>
              </div>

              <div>
                <p className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-faint">Extra points</p>
                <div className="mt-2 divide-y divide-[var(--border)] rounded-2xl bg-surface">
                  <Row label="Verified identity" hint="Bonus for a KYC attestation." value={levers.kycBonus} min={0} max={200} step={5} onChange={(v) => set({ kycBonus: v })} unit="pts" />
                  <Row label="Full-stack threshold" hint="Apps needed to earn the bonus." value={levers.fullStackThreshold} min={2} max={9} onChange={(v) => set({ fullStackThreshold: v })} unit="apps" />
                  <Row label="Full-stack bonus" hint="What hitting it earns." value={levers.fullStackBonus} min={0} max={200} step={5} onChange={(v) => set({ fullStackBonus: v })} unit="pts" />
                </div>
              </div>

              <div>
                <p className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-faint">Thin files</p>
                <div className="mt-2 divide-y divide-[var(--border)] rounded-2xl bg-surface">
                  <Row label="Too few transactions" hint="Below this, it's a thin file. 0 = off." value={levers.thinFileTx} min={0} max={50} onChange={(v) => set({ thinFileTx: v })} unit="txs" />
                  <Row label="Points docked" hint="What a thin file loses." value={levers.thinFilePenalty} min={0} max={300} step={10} onChange={(v) => set({ thinFilePenalty: v })} unit="pts" />
                </div>
              </div>

              <div>
                <p className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-faint">Sanctions</p>
                <div className="rounded-2xl bg-surface">
                  <label className="flex items-center justify-between gap-4 px-6 py-5">
                    <div>
                      <div className="text-[15px] font-semibold">Hard-block listed wallets</div>
                      <div className="mt-0.5 text-xs text-faint">Score 0, own band, never served.</div>
                    </div>
                    <button
                      role="switch"
                      aria-checked={levers.sanctionsBlock}
                      onClick={() => set({ sanctionsBlock: !levers.sanctionsBlock })}
                      className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
                      style={{ background: levers.sanctionsBlock ? "var(--risk-low)" : "var(--border-strong)" }}
                    >
                      <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all" style={{ left: levers.sanctionsBlock ? "22px" : "2px" }} />
                    </button>
                  </label>
                  {!levers.sanctionsBlock && (
                    <div className="border-t border-line">
                      <Row label="Points docked instead" hint="When not hard-blocking." value={levers.sanctionsPenalty} min={0} max={1000} step={25} onChange={(v) => set({ sanctionsPenalty: v })} unit="pts" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </details>

          <button
            onClick={() => setLevers({ ...DEFAULT_LEVERS })}
            className="mt-8 text-xs font-medium text-faint hover:text-accent-strong transition-colors"
          >
            Reset to baseline
          </button>
        </div>
      </div>

      {/* Live impact rail */}
      <aside className="sticky top-0 h-screen w-80 shrink-0 overflow-y-auto border-l border-line bg-surface px-5 py-8">
        <h2 className="text-sm font-bold">Live impact</h2>
        <p className="mt-0.5 text-[11px] text-faint">{summary.total.toLocaleString()} wallets, re-scored as you drag.</p>
        {movement.moved > 0 && (
          <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-[11px] text-muted tabular-nums">
            <span style={{ color: "var(--risk-low)" }}>▲{movement.up} safer</span> ·{" "}
            <span style={{ color: "var(--risk-high)" }}>▼{movement.down} riskier</span> than baseline
          </p>
        )}
        <div className="mt-4">
          <Histogram summary={summary} baseline={baselineSummary} />
        </div>
        <div className="mt-5 border-t border-line pt-4">
          <Donut summary={summary} />
        </div>
        <div className="mt-5 border-t border-line pt-4">
          <SavedModels levers={levers} onChange={setLevers} />
        </div>
      </aside>
    </div>
  );
}
