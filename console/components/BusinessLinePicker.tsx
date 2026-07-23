"use client";

import { useEffect, useState } from "react";

export interface BusinessLine {
  id: number;
  name: string;
  api_key: string;
  model_id: number | null;
  model_name: string | null;
  model_version: number | null;
  watchlist_id: number | null;
  watchlist_name: string | null;
}

/** Business-line selector with inline "new line" creation — shared by the
 *  portfolio and wallets pages so every team at Visa can have its own view. */
export default function BusinessLinePicker({
  value, onChange,
}: {
  value: BusinessLine | null;
  onChange: (line: BusinessLine | null) => void;
}) {
  const [lines, setLines] = useState<BusinessLine[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function load(): Promise<BusinessLine[]> {
    const j = await fetch("/api/business-lines").then((r) => r.json()).catch(() => null);
    const list: BusinessLine[] = j?.data ?? [];
    setLines(list);
    return list;
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const res = await fetch("/api/business-lines", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    }).catch(() => null);
    const j = await res?.json();
    setBusy(false);
    if (j?.data) {
      setName("");
      setAdding(false);
      const list = await load();
      onChange(list.find((l) => l.id === j.data.id) ?? j.data);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={value?.id ?? ""}
        onChange={(e) => {
          const id = Number(e.target.value);
          onChange(lines.find((l) => l.id === id) ?? null);
        }}
        className="rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
        aria-label="Business line"
      >
        <option value="">All of Visa</option>
        {lines.map((l) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>
      {adding ? (
        <form onSubmit={create} className="flex items-center gap-1.5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New business line…"
            className="w-44 rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-sm placeholder:text-faint focus:outline-none focus:border-accent"
          />
          <button type="submit" disabled={busy || !name.trim()} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-strong disabled:opacity-50">
            {busy ? "…" : "Add"}
          </button>
          <button type="button" onClick={() => setAdding(false)} className="text-sm text-faint hover:text-muted">✕</button>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="rounded-lg border border-line-strong px-2.5 py-1.5 text-sm text-muted hover:border-accent hover:text-accent-strong transition-colors"
          title="Add a business line"
        >
          +
        </button>
      )}
    </div>
  );
}
