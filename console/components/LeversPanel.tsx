"use client";

import { useEffect, useState } from "react";
import { DEFAULT_LEVERS, PRESETS, type Levers } from "@/lib/model";

interface SavedModel { id: number; name: string; actor: string; version: number; updated_at: string; levers: Levers }
interface AuditRow { model_name: string; version: number; actor: string; created_at: string }

/** Publish/load named lever configurations with an audit trail + share links. */
function SavedModels({ levers, onChange }: { levers: Levers; onChange: (l: Levers) => void }) {
  const [models, setModels] = useState<SavedModel[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [name, setName] = useState("");
  const [actor, setActor] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function load() {
    const j = await fetch("/api/models").then((r) => r.json()).catch(() => null);
    setModels(j?.data?.models ?? []);
    setAudit(j?.data?.audit ?? []);
  }
  useEffect(() => {
    load();
    const savedActor = localStorage.getItem("vrc-actor");
    if (savedActor) setActor(savedActor);
  }, []);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    localStorage.setItem("vrc-actor", actor);
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, actor, levers }),
      });
      const j = await res.json();
      if (!res.ok) setMsg({ text: j.error ?? "Publish failed.", ok: false });
      else {
        setMsg({ text: `Published ${j.data.name} v${j.data.version}.`, ok: true });
        setName("");
        await load();
      }
    } catch {
      setMsg({ text: "Network error.", ok: false });
    }
    setBusy(false);
  }

  function share(m: SavedModel) {
    const url = `${window.location.origin}/?model=${m.id}`;
    navigator.clipboard.writeText(url);
    setMsg({ text: `Share link copied — ${m.name} v${m.version}.`, ok: true });
  }

  return (
    <section className="border-t border-line pt-4">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-faint">Saved models</h3>
      {models.length > 0 && (
        <div className="mt-2.5 space-y-1.5">
          {models.slice(0, 5).map((m) => (
            <div key={m.id} className="flex items-center gap-1.5">
              <button
                onClick={() => onChange({ ...DEFAULT_LEVERS, ...m.levers })}
                className="min-w-0 flex-1 truncate rounded-md border border-line-strong px-2.5 py-1.5 text-left text-[11px] text-muted hover:border-accent hover:text-accent-strong transition-colors"
                title={`Load ${m.name} v${m.version} (${m.actor || "unknown"})`}
              >
                {m.name} <span className="text-faint">v{m.version}</span>
              </button>
              <button
                onClick={() => share(m)}
                className="rounded-md border border-line-strong px-2 py-1.5 text-[11px] text-muted hover:border-accent hover:text-accent-strong transition-colors"
                title="Copy share link"
                aria-label={`Copy share link for ${m.name}`}
              >
                ⧉
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={publish} className="mt-2.5 space-y-1.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Model name, e.g. Q3 onboarding"
          className="w-full rounded-md border border-line-strong bg-surface-2 px-2.5 py-1.5 text-[11px] placeholder:text-faint focus:outline-none focus:border-accent"
        />
        <div className="flex gap-1.5">
          <input
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            placeholder="Your name"
            className="min-w-0 flex-1 rounded-md border border-line-strong bg-surface-2 px-2.5 py-1.5 text-[11px] placeholder:text-faint focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="rounded-md bg-accent px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-accent-strong transition-colors disabled:opacity-50"
          >
            {busy ? "…" : "Publish"}
          </button>
        </div>
      </form>
      {msg && (
        <p className="mt-1.5 text-[11px]" style={{ color: msg.ok ? "var(--risk-low)" : "var(--risk-high)" }}>{msg.text}</p>
      )}
      {audit.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">Audit trail</p>
          <ul className="mt-1.5 space-y-1 text-[10px] leading-snug text-faint">
            {audit.slice(0, 5).map((a, i) => (
              <li key={i}>
                <span className="text-muted">{a.model_name} v{a.version}</span> · {a.actor || "unknown"} ·{" "}
                {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Slider({
  label, value, min, max, step = 1, unit, onChange, format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted">{label}</span>
        <span className="font-mono text-xs font-semibold text-foreground tabular-nums">
          {format ? format(value) : value}{unit ?? ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5"
      />
    </label>
  );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-4">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-faint">{title}</h3>
      {hint && <p className="mt-1 text-[11px] leading-snug text-faint">{hint}</p>}
      <div className="mt-3 space-y-3.5">{children}</div>
    </section>
  );
}

const fmtK = (v: number) => (v >= 1_000_000 ? `${v / 1_000_000}M` : v >= 1000 ? `${v / 1000}k` : String(v));

export default function LeversPanel({ levers, onChange }: { levers: Levers; onChange: (l: Levers) => void }) {
  const set = (patch: Partial<Levers>) => onChange({ ...levers, ...patch });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold">Model levers</h2>
        <p className="mt-0.5 text-[11px] text-faint">Every change re-scores the portfolio instantly.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => onChange({ ...p.levers })}
              title={p.note}
              className="rounded-full border border-line-strong px-2.5 py-1 text-[11px] font-medium text-muted hover:border-accent hover:text-accent-strong transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <Group title="Factor weights" hint="Relative importance — normalized to their sum.">
        <Slider label="Activity (tx count)" value={levers.wActivity} min={0} max={100} onChange={(v) => set({ wActivity: v })} />
        <Slider label="Volume (lifetime USD)" value={levers.wVolume} min={0} max={100} onChange={(v) => set({ wVolume: v })} />
        <Slider label="Breadth (apps used)" value={levers.wBreadth} min={0} max={100} onChange={(v) => set({ wBreadth: v })} />
        <Slider label="Ticket size (avg USD/tx)" value={levers.wTicket} min={0} max={100} onChange={(v) => set({ wTicket: v })} />
      </Group>

      <Group title="Temperature" hint="Strictness curve. 1.0 = linear · above = strict (mid-range scores drop) · below = lenient.">
        <Slider label="Curve exponent" value={levers.temperature} min={0.5} max={2} step={0.05} onChange={(v) => set({ temperature: v })} format={(v) => v.toFixed(2)} />
      </Group>

      <Group title="Calibration ceilings" hint="Where each metric saturates to full credit.">
        <Slider label="Activity ceiling" value={levers.activityCeil} min={100} max={10000} step={100} onChange={(v) => set({ activityCeil: v })} format={fmtK} />
        <Slider label="Volume ceiling" value={levers.volumeCeil} min={100_000} max={50_000_000} step={100_000} onChange={(v) => set({ volumeCeil: v })} format={(v) => `$${fmtK(v)}`} />
        <Slider label="Breadth saturation" value={levers.breadthSat} min={2} max={10} onChange={(v) => set({ breadthSat: v })} unit=" apps" />
        <Slider label="Ticket ceiling" value={levers.ticketCeil} min={1000} max={250_000} step={1000} onChange={(v) => set({ ticketCeil: v })} format={(v) => `$${fmtK(v)}`} />
      </Group>

      <Group title="Bonuses">
        <Slider label="KYC attestation bonus" value={levers.kycBonus} min={0} max={200} step={5} onChange={(v) => set({ kycBonus: v })} unit=" pts" />
        <Slider label="Full-stack threshold" value={levers.fullStackThreshold} min={2} max={9} onChange={(v) => set({ fullStackThreshold: v })} unit=" apps" />
        <Slider label="Full-stack bonus" value={levers.fullStackBonus} min={0} max={200} step={5} onChange={(v) => set({ fullStackBonus: v })} unit=" pts" />
      </Group>

      <Group title="Penalties" hint="Dock wallets with too little history to trust.">
        <Slider label="Thin-file threshold" value={levers.thinFileTx} min={0} max={50} onChange={(v) => set({ thinFileTx: v })} unit=" txs" />
        <Slider label="Thin-file penalty" value={levers.thinFilePenalty} min={0} max={300} step={10} onChange={(v) => set({ thinFilePenalty: v })} unit=" pts" />
      </Group>

      <Group title="Sanctions policy">
        <label className="flex items-center justify-between gap-3 text-xs text-muted">
          <span>Hard-block listed wallets</span>
          <button
            role="switch"
            aria-checked={levers.sanctionsBlock}
            onClick={() => set({ sanctionsBlock: !levers.sanctionsBlock })}
            className="relative h-5 w-9 rounded-full transition-colors"
            style={{ background: levers.sanctionsBlock ? "var(--accent)" : "var(--border-strong)" }}
          >
            <span
              className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
              style={{ left: levers.sanctionsBlock ? "18px" : "2px" }}
            />
          </button>
        </label>
        {!levers.sanctionsBlock && (
          <Slider label="Sanctions penalty" value={levers.sanctionsPenalty} min={0} max={1000} step={25} onChange={(v) => set({ sanctionsPenalty: v })} unit=" pts" />
        )}
      </Group>

      <Group title="Risk bands" hint="You define what counts as risky — the tool has no opinion.">
        <Slider label="Low risk at ≥" value={levers.lowMin} min={levers.elevatedMin + 50} max={950} step={10} onChange={(v) => set({ lowMin: v })} />
        <Slider label="Elevated at ≥" value={levers.elevatedMin} min={50} max={levers.lowMin - 50} step={10} onChange={(v) => set({ elevatedMin: v })} />
        <div className="flex overflow-hidden rounded-md text-center text-[10px] font-semibold text-white">
          <div style={{ width: `${(levers.elevatedMin / 1000) * 100}%`, background: "var(--risk-high)" }} className="py-1">High</div>
          <div style={{ width: `${((levers.lowMin - levers.elevatedMin) / 1000) * 100}%`, background: "var(--risk-elevated)" }} className="py-1">Elevated</div>
          <div style={{ width: `${((1000 - levers.lowMin) / 1000) * 100}%`, background: "var(--risk-low)" }} className="py-1">Low</div>
        </div>
      </Group>

      <SavedModels levers={levers} onChange={onChange} />

      <button
        onClick={() => onChange({ ...DEFAULT_LEVERS })}
        className="w-full rounded-lg border border-line-strong py-2 text-xs font-medium text-muted hover:border-accent hover:text-accent-strong transition-colors"
      >
        Reset to production baseline
      </button>
    </div>
  );
}
