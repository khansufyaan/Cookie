"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LEVERS, PRESETS, bandMovement, scorePortfolio, summarize,
  type Levers, type WalletRow,
} from "@/lib/model";
import { useLevers } from "@/lib/useLevers";
import { Donut, Histogram } from "./charts";
import { SavedModels } from "./LeversPanel";

/* ---------- One lever row: control + plain-English definition ---------- */

function Lever({
  label, plain, value, min, max, step = 1, unit, onChange, format,
}: {
  label: string;
  plain: string; // simple-English definition
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-semibold">{label}</span>
        <span className="font-mono text-sm font-bold text-accent-strong tabular-nums">
          {format ? format(value) : value}{unit ?? ""}
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-faint">{plain}</p>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3"
        aria-label={label}
      />
    </div>
  );
}

function GroupHeader({ n, title, plain }: { n: string; title: string; plain: string }) {
  return (
    <div className="mt-10 first:mt-0">
      <div className="flex items-baseline gap-3">
        <span className="visa-wordmark text-lg" style={{ color: "var(--accent-strong)" }}>{n}</span>
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      </div>
      <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">{plain}</p>
    </div>
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

  return (
    <div className="flex">
      {/* Levers with definitions */}
      <div className="min-w-0 flex-1 px-6 py-6">
        <h1 className="text-xl font-bold tracking-tight">Model workbench</h1>
        <p className="mt-0.5 max-w-xl text-xs text-faint">
          This is where you define risk. Each lever below changes how every monitored wallet is scored — the preview
          on the right updates live. Publish a configuration to version it and bind it to a business line.
          {loadedModel && <span className="ml-1 text-accent-strong">Loaded: {loadedModel}</span>}
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => setLevers({ ...p.levers })}
              title={p.note}
              className="rounded-full border border-line-strong px-3.5 py-1.5 text-xs font-medium text-muted hover:border-accent hover:text-accent-strong transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="max-w-2xl">
          <GroupHeader
            n="01" title="Factor weights"
            plain="The recipe. Four ingredients make up the score — decide how much each one counts. Weights are relative: if Activity is 40 and the rest are 20, Activity is twice as important as anything else."
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Lever label="Activity" plain="How often the wallet transacts. More transactions, more points." value={levers.wActivity} min={0} max={100} onChange={(v) => set({ wActivity: v })} />
            <Lever label="Volume" plain="The total dollars the wallet has ever moved." value={levers.wVolume} min={0} max={100} onChange={(v) => set({ wVolume: v })} />
            <Lever label="Breadth" plain="How many different apps the wallet uses. A wallet seen everywhere has a fuller history than one seen once." value={levers.wBreadth} min={0} max={100} onChange={(v) => set({ wBreadth: v })} />
            <Lever label="Ticket size" plain="Average dollars per transaction. Large average tickets read as institutional behavior." value={levers.wTicket} min={0} max={100} onChange={(v) => set({ wTicket: v })} />
          </div>

          <GroupHeader
            n="02" title="Temperature"
            plain="One dial for how tough the grader is. At 1.0 scoring is neutral. Turn it up and partial credit shrinks — mediocre wallets fall hard. Turn it down and the model is forgiving of thin history."
          />
          <div className="mt-4">
            <Lever label="Strictness curve" plain="1.0 = neutral · 2.0 = very strict · 0.5 = very lenient." value={levers.temperature} min={0.5} max={2} step={0.05} onChange={(v) => set({ temperature: v })} format={(v) => v.toFixed(2)} />
          </div>

          <GroupHeader
            n="03" title="Calibration ceilings"
            plain="Where 'more' stops helping. Example: with a $5M volume ceiling, a wallet that has moved $5M earns full Volume credit — moving $50M adds nothing further. Lower a ceiling to make credit easier to max out; raise it to demand more."
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Lever label="Activity ceiling" plain="Transactions needed for full Activity credit." value={levers.activityCeil} min={100} max={10000} step={100} onChange={(v) => set({ activityCeil: v })} format={fmtK} unit=" txs" />
            <Lever label="Volume ceiling" plain="Lifetime dollars needed for full Volume credit." value={levers.volumeCeil} min={100_000} max={50_000_000} step={100_000} onChange={(v) => set({ volumeCeil: v })} format={(v) => `$${fmtK(v)}`} />
            <Lever label="Breadth saturation" plain="Apps needed for full Breadth credit." value={levers.breadthSat} min={2} max={10} onChange={(v) => set({ breadthSat: v })} unit=" apps" />
            <Lever label="Ticket ceiling" plain="Average ticket needed for full Ticket-size credit." value={levers.ticketCeil} min={1000} max={250_000} step={1000} onChange={(v) => set({ ticketCeil: v })} format={(v) => `$${fmtK(v)}`} />
          </div>

          <GroupHeader
            n="04" title="Bonuses"
            plain="Flat extra points for trust signals that the four factors can't see."
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Lever label="KYC bonus" plain="Extra points when the wallet's owner has a verified identity attestation." value={levers.kycBonus} min={0} max={200} step={5} onChange={(v) => set({ kycBonus: v })} unit=" pts" />
            <Lever label="Full-stack threshold" plain="How many apps a wallet must use to earn the breadth bonus." value={levers.fullStackThreshold} min={2} max={9} onChange={(v) => set({ fullStackThreshold: v })} unit=" apps" />
            <Lever label="Full-stack bonus" plain="The points that hitting the threshold earns." value={levers.fullStackBonus} min={0} max={200} step={5} onChange={(v) => set({ fullStackBonus: v })} unit=" pts" />
          </div>

          <GroupHeader
            n="05" title="Penalties"
            plain="Points taken away when there isn't enough history to trust. A wallet with 3 transactions can look clean simply because it hasn't done anything yet."
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Lever label="Thin-file threshold" plain="Wallets with fewer transactions than this count as thin files. 0 turns the penalty off." value={levers.thinFileTx} min={0} max={50} onChange={(v) => set({ thinFileTx: v })} unit=" txs" />
            <Lever label="Thin-file penalty" plain="How many points a thin file loses." value={levers.thinFilePenalty} min={0} max={300} step={10} onChange={(v) => set({ thinFilePenalty: v })} unit=" pts" />
          </div>

          <GroupHeader
            n="06" title="Sanctions policy"
            plain="What happens when a wallet appears on the OFAC sanctions list."
          />
          <div className="mt-4 rounded-xl border border-line bg-surface px-5 py-4">
            <label className="flex items-center justify-between gap-3">
              <div>
                <span className="text-sm font-semibold">Hard-block listed wallets</span>
                <p className="mt-1 text-xs leading-relaxed text-faint">
                  On: score forced to 0 and the wallet gets its own “Sanctioned” band — never serve it. Off: dock
                  points instead and let the bands decide.
                </p>
              </div>
              <button
                role="switch"
                aria-checked={levers.sanctionsBlock}
                onClick={() => set({ sanctionsBlock: !levers.sanctionsBlock })}
                className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
                style={{ background: levers.sanctionsBlock ? "var(--accent)" : "var(--border-strong)" }}
              >
                <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: levers.sanctionsBlock ? "22px" : "2px" }} />
              </button>
            </label>
            {!levers.sanctionsBlock && (
              <div className="mt-4">
                <Lever label="Sanctions penalty" plain="Points docked from a listed wallet when not hard-blocking." value={levers.sanctionsPenalty} min={0} max={1000} step={25} onChange={(v) => set({ sanctionsPenalty: v })} unit=" pts" />
              </div>
            )}
          </div>

          <GroupHeader
            n="07" title="Risk bands"
            plain="Where you draw the lines. Everything at or above the Low line is low risk, between the lines is elevated, below is high risk. The tool has no opinion — these thresholds ARE your risk policy."
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Lever label="Low risk at ≥" plain="Scores at or above this line are low risk." value={levers.lowMin} min={levers.elevatedMin + 50} max={950} step={10} onChange={(v) => set({ lowMin: v })} />
            <Lever label="Elevated at ≥" plain="Scores between this line and the Low line are elevated." value={levers.elevatedMin} min={50} max={levers.lowMin - 50} step={10} onChange={(v) => set({ elevatedMin: v })} />
          </div>
          <div className="mt-3 flex overflow-hidden rounded-lg text-center text-[11px] font-semibold text-white">
            <div style={{ width: `${(levers.elevatedMin / 1000) * 100}%`, background: "var(--risk-high)" }} className="py-1.5 transition-all duration-300">High · 0–{levers.elevatedMin - 1}</div>
            <div style={{ width: `${((levers.lowMin - levers.elevatedMin) / 1000) * 100}%`, background: "var(--risk-elevated)" }} className="py-1.5 transition-all duration-300">Elevated</div>
            <div style={{ width: `${((1000 - levers.lowMin) / 1000) * 100}%`, background: "var(--risk-low)" }} className="py-1.5 transition-all duration-300">Low · {levers.lowMin}+</div>
          </div>

          <button
            onClick={() => setLevers({ ...DEFAULT_LEVERS })}
            className="mt-8 rounded-lg border border-line-strong px-4 py-2 text-xs font-medium text-muted hover:border-accent hover:text-accent-strong transition-colors"
          >
            Reset everything to production baseline
          </button>
        </div>
      </div>

      {/* Live preview + publish rail */}
      <aside className="sticky top-0 h-screen w-80 shrink-0 overflow-y-auto border-l border-line bg-surface px-5 py-6">
        <h2 className="text-sm font-bold">Live impact</h2>
        <p className="mt-0.5 text-[11px] text-faint">
          {summary.total.toLocaleString()} monitored wallets, re-scored as you drag.
        </p>
        {movement.moved > 0 && (
          <p className="mt-2 rounded-lg border border-line-strong px-3 py-2 text-[11px] text-muted tabular-nums">
            vs production baseline:{" "}
            <span style={{ color: "var(--risk-low)" }}>▲{movement.up} safer</span> ·{" "}
            <span style={{ color: "var(--risk-high)" }}>▼{movement.down} riskier</span>
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
