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
          <div className="mt-1 text-[13px] text-muted">{hint}</div>
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

interface SavedModelRef { id: number; name: string; version: number; levers: Levers }

export default function ModelWorkbench() {
  const { levers, setLevers, loadedModel } = useLevers();
  const [rows, setRows] = useState<WalletRow[]>([]);
  const [saved, setSaved] = useState<SavedModelRef[]>([]);
  const [active, setActive] = useState<SavedModelRef | null>(null);
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const set = (patch: Partial<Levers>) => setLevers({ ...levers, ...patch });

  async function deleteActive() {
    if (!active) return;
    if (!window.confirm(`Delete "${active.name}"? Business lines using it revert to the baseline.`)) return;
    setDeleting(true);
    await fetch(`/api/models/${active.id}`, { method: "DELETE" }).catch(() => null);
    setDeleting(false);
    setActive(null);
    setLevers({ ...DEFAULT_LEVERS });
    await loadSaved();
    window.dispatchEvent(new Event("vrc-models-changed"));
  }

  async function loadSaved() {
    const j = await fetch("/api/models").then((r) => r.json()).catch(() => null);
    setSaved(j?.data?.models ?? []);
  }
  useEffect(() => {
    fetch("/api/portfolio?watchlist=all")
      .then((r) => r.json())
      .then((j) => setRows(j.data ?? []))
      .catch(() => {});
    loadSaved();
    const onChange = () => loadSaved();
    window.addEventListener("vrc-models-changed", onChange);
    return () => window.removeEventListener("vrc-models-changed", onChange);
  }, []);

  const scored = useMemo(() => scorePortfolio(rows, levers), [rows, levers]);
  const baseline = useMemo(() => scorePortfolio(rows, DEFAULT_LEVERS), [rows]);
  const summary = useMemo(() => summarize(scored), [scored]);
  const baselineSummary = useMemo(() => summarize(baseline), [baseline]);
  const movement = useMemo(() => bandMovement(scored, baseline), [scored, baseline]);

  const activePreset = PRESETS.find((p) => JSON.stringify(p.levers) === JSON.stringify(levers))?.name;
  const activeEdited =
    active !== null && JSON.stringify({ ...DEFAULT_LEVERS, ...active.levers }) !== JSON.stringify(levers);

  async function updateActive() {
    if (!active) return;
    setUpdating(true);
    const res = await fetch("/api/models", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: active.name, actor: localStorage.getItem("vrc-actor") ?? "", levers }),
    }).catch(() => null);
    const j = await res?.json();
    if (j?.data) {
      setActive({ id: j.data.id, name: j.data.name, version: j.data.version, levers });
      await loadSaved();
    }
    setUpdating(false);
  }

  return (
    <div className="flex">
      <div className="min-w-0 flex-1 px-8 py-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight">Your risk model.</h1>
          <p className="mt-1.5 text-sm text-muted">
            Move a lever, watch every wallet re-score. No opinions — just yours.
            {loadedModel && !active && <span className="ml-1 text-accent-strong">Loaded: {loadedModel}</span>}
          </p>

          {/* Starting points + YOUR named configs, side by side */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-surface p-1">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => { setLevers({ ...p.levers }); setActive(null); }}
                  title={p.note}
                  className="rounded-lg px-4 py-1.5 text-xs font-semibold transition-all"
                  style={
                    activePreset === p.name && !active
                      ? { background: "var(--accent)", color: "#fff" }
                      : { color: "var(--muted)" }
                  }
                >
                  {p.name.replace("Production baseline", "Baseline")}
                </button>
              ))}
            </div>
            {saved.length > 0 && (
              <div className="inline-flex flex-wrap gap-1 rounded-xl bg-surface p-1">
                {saved.slice(0, 6).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setLevers({ ...DEFAULT_LEVERS, ...m.levers });
                      setActive(m);
                    }}
                    title={`Your saved config · v${m.version}`}
                    className="rounded-lg px-4 py-1.5 text-xs font-semibold transition-all"
                    style={
                      active?.id === m.id
                        ? { background: "var(--accent)", color: "#fff" }
                        : { color: "var(--muted)" }
                    }
                  >
                    {m.name}
                    {active?.id === m.id && activeEdited && <span className="ml-1 opacity-80">●</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active config: save edits + its dedicated API call */}
          {active && (
            <div className="mt-3 rounded-2xl bg-surface px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm">
                  <span className="font-semibold">{active.name}</span>{" "}
                  <span className="text-faint">v{active.version}</span>
                  {activeEdited && <span className="ml-2 text-xs text-accent-strong">edited — unsaved</span>}
                </div>
                <div className="flex items-center gap-2">
                  {activeEdited && (
                    <button
                      onClick={updateActive}
                      disabled={updating}
                      className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent-strong transition-colors disabled:opacity-50"
                    >
                      {updating ? "Saving…" : `Save to ${active.name}`}
                    </button>
                  )}
                  <button
                    onClick={deleteActive}
                    disabled={deleting}
                    className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-medium text-faint hover:border-[var(--risk-high)] hover:text-[var(--risk-high)] transition-colors disabled:opacity-50"
                  >
                    {deleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg bg-surface-2 px-3 py-2 font-mono text-[11px] text-muted">
                  GET /api/v1/assess/&lt;address&gt;?model={active.id} · header X-VRC-Key: &lt;your-line-key&gt;
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `curl "${window.location.origin}/api/v1/assess/<address>?model=${active.id}" -H "X-VRC-Key: <your-business-line-key>"`,
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="rounded-lg border border-line-strong px-3 py-2 text-[11px] font-medium text-muted hover:border-accent hover:text-accent-strong transition-colors"
                >
                  {copied ? "✓ Copied" : "Copy curl"}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-faint">
                Any wallet checked against this call is scored under <span className="text-muted">{active.name}</span> — exactly as configured here.
              </p>
            </div>
          )}

          <Section title="What counts" sub="Four ingredients. You set the mix.">
            <Row label="Activity" hint="How often it transacts." value={levers.wActivity} min={0} max={100} onChange={(v) => set({ wActivity: v })} />
            <Row label="Volume" hint="Total dollars ever moved." value={levers.wVolume} min={0} max={100} onChange={(v) => set({ wVolume: v })} />
            <Row label="Breadth" hint="How many apps it uses." value={levers.wBreadth} min={0} max={100} onChange={(v) => set({ wBreadth: v })} />
            <Row label="Ticket size" hint="Average dollars per transaction." value={levers.wTicket} min={0} max={100} onChange={(v) => set({ wTicket: v })} />
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
                <p className="mt-0.5 text-sm text-faint">Ceilings, bonuses, sanctions.</p>
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
                  <Row label="Full-stack bonus" hint="Points for using 5+ tracked apps." value={levers.fullStackBonus} min={0} max={200} step={5} onChange={(v) => set({ fullStackBonus: v })} unit="pts" />
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

      {/* Live impact rail — wide, so the charts carry the page */}
      <aside className="sticky top-0 h-screen w-[27rem] shrink-0 overflow-y-auto border-l border-line bg-surface px-6 py-8">
        <h2 className="text-sm font-bold">Live impact</h2>
        <p className="mt-0.5 text-[11px] text-faint">{summary.total.toLocaleString()} wallets, re-scored as you drag.</p>
        {movement.moved > 0 && (
          <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-[11px] text-muted tabular-nums">
            <span style={{ color: "var(--risk-low)" }}>▲{movement.up} safer</span> ·{" "}
            <span style={{ color: "var(--risk-high)" }}>▼{movement.down} riskier</span> than baseline
          </p>
        )}
        <div className="mt-5">
          <Histogram summary={summary} baseline={baselineSummary} height={230} />
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
