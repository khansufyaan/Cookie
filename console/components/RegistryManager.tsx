"use client";

import { useEffect, useState } from "react";
import { KIND_META, type MonitoredContract } from "@/lib/registry";

interface CustomRow {
  id: number;
  label: string;
  chain: string;
  address: string;
  kind: MonitoredContract["kind"];
  added_by: string;
  status: string;
}

const KINDS: MonitoredContract["kind"][] = ["visa-internal", "hsm-wallet", "public-app"];

export default function RegistryManager() {
  const [builtin, setBuiltin] = useState<MonitoredContract[]>([]);
  const [custom, setCustom] = useState<CustomRow[]>([]);
  const [form, setForm] = useState({ label: "", chain: "Ethereum", address: "", kind: "visa-internal" as MonitoredContract["kind"], addedBy: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function load() {
    const j = await fetch("/api/registry").then((r) => r.json()).catch(() => null);
    setBuiltin(j?.data?.builtin ?? []);
    setCustom(j?.data?.custom ?? []);
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/registry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) setMsg({ text: j.error ?? "Add failed.", ok: false });
      else {
        setMsg({ text: `Added "${j.data.label}" — ${j.meta?.note ?? "queued."}`, ok: true });
        setForm({ ...form, label: "", address: "" });
        await load();
      }
    } catch {
      setMsg({ text: "Network error.", ok: false });
    }
    setBusy(false);
  }

  const kindChip = (kind: MonitoredContract["kind"]) => (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
      style={
        kind === "public-app"
          ? { color: "var(--muted)", border: "1px solid var(--border-strong)" }
          : { color: "var(--accent-strong)", border: "1px solid var(--accent)" }
      }
      title={KIND_META[kind].hint}
    >
      {KIND_META[kind].label}
    </span>
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <h1 className="text-xl font-bold tracking-tight">Monitored contracts &amp; entry points</h1>
      <p className="mt-0.5 max-w-2xl text-xs text-faint">
        Every wallet that interacts with these contracts is discovered and rated. Admins can add new public contracts,
        Visa-internal app endpoints, or HSM-custodied wallets that customers transact with.
      </p>

      {/* Admin add */}
      <section className="mt-6 rounded-xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold">Add to monitoring <span className="ml-1 rounded border border-line-strong px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-faint">Admin</span></h2>
        <form onSubmit={submit} className="mt-3 grid gap-2 sm:grid-cols-[1fr_130px]">
          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder='Label, e.g. "Visa Direct settlement contract" or "HSM hot wallet #3"'
            className="rounded-lg border border-line-strong bg-surface-2 px-3.5 py-2 text-sm placeholder:text-faint focus:outline-none focus:border-accent"
          />
          <select
            value={form.chain}
            onChange={(e) => setForm({ ...form, chain: e.target.value })}
            className="rounded-lg border border-line-strong bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            {["Ethereum", "Base", "Polygon", "Solana"].map((c) => <option key={c}>{c}</option>)}
          </select>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Contract or wallet address (0x… / Solana)"
            className="rounded-lg border border-line-strong bg-surface-2 px-3.5 py-2 font-mono text-xs placeholder:text-faint focus:outline-none focus:border-accent"
          />
          <select
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value as MonitoredContract["kind"] })}
            className="rounded-lg border border-line-strong bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            {KINDS.map((k) => <option key={k} value={k}>{KIND_META[k].label}</option>)}
          </select>
          <input
            value={form.addedBy}
            onChange={(e) => setForm({ ...form, addedBy: e.target.value })}
            placeholder="Your name (audit)"
            className="rounded-lg border border-line-strong bg-surface-2 px-3.5 py-2 text-sm placeholder:text-faint focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={busy || !form.label.trim() || !form.address.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong transition-colors disabled:opacity-50"
          >
            {busy ? "Adding…" : "Add to monitoring"}
          </button>
        </form>
        {msg && <p className="mt-2 text-xs" style={{ color: msg.ok ? "var(--risk-low)" : "var(--risk-high)" }}>{msg.text}</p>}
      </section>

      {/* Custom (admin-added) */}
      {custom.length > 0 && (
        <section className="mt-5">
          <h2 className="text-sm font-semibold">Added by Visa <span className="text-faint font-normal">({custom.length})</span></h2>
          <div className="mt-2 overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-line bg-surface text-left text-[10px] uppercase tracking-wider text-faint">
                  <th className="px-3 py-2">Label</th><th className="px-3 py-2">Chain</th><th className="px-3 py-2">Address</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">By</th>
                </tr>
              </thead>
              <tbody>
                {custom.map((c) => (
                  <tr key={c.id} className="border-b border-line last:border-0 bg-surface">
                    <td className="px-3 py-2 font-medium">{c.label}</td>
                    <td className="px-3 py-2 text-muted">{c.chain}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-muted">{c.address.slice(0, 10)}…{c.address.slice(-6)}</td>
                    <td className="px-3 py-2">{kindChip(c.kind)}</td>
                    <td className="px-3 py-2">
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ color: "var(--risk-elevated)", border: "1px solid var(--risk-elevated)" }}>
                        {c.status === "pending" ? "Pending indexer" : c.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-faint">{c.added_by || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Built-in */}
      <section className="mt-5">
        <h2 className="text-sm font-semibold">Public app coverage <span className="text-faint font-normal">({builtin.length} entry points)</span></h2>
        <div className="mt-2 overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line bg-surface text-left text-[10px] uppercase tracking-wider text-faint">
                <th className="px-3 py-2">Contract</th><th className="px-3 py-2">Chain</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Address</th><th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {builtin.map((c) => (
                <tr key={c.address} className="border-b border-line last:border-0 bg-surface">
                  <td className="px-3 py-2 font-medium">{c.label}</td>
                  <td className="px-3 py-2 text-muted">{c.chain}</td>
                  <td className="px-3 py-2 text-muted">{c.category}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-muted">{c.address.slice(0, 10)}…{c.address.slice(-6)}</td>
                  <td className="px-3 py-2">
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                      style={c.status === "live" ? { color: "var(--risk-low)", border: "1px solid var(--risk-low)" } : { color: "var(--risk-elevated)", border: "1px solid var(--risk-elevated)" }}
                    >
                      {c.status === "live" ? "● Live" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
