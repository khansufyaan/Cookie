"use client";

import { useEffect, useRef, useState } from "react";

interface Watchlist { id: number; name: string; wallet_count: number }

interface UploadResult {
  submitted: number;
  valid: number;
  invalid: number;
  addedToWatchlist: number;
  newlyQueuedForRating: number;
}

export default function WalletManager() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [addresses, setAddresses] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadLists() {
    const j = await fetch("/api/watchlists").then((r) => r.json()).catch(() => ({ data: [] }));
    setWatchlists(j.data ?? []);
    if (j.data?.length && selected === null) setSelected(j.data[0].id);
  }
  useEffect(() => {
    loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createList(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/watchlists", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    const j = await res.json();
    if (!res.ok) return setError(j.error ?? "Failed to create watchlist.");
    setNewName("");
    await loadLists();
    setSelected(j.data.id);
  }

  function onFile(f: File | undefined) {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      // Pull anything address-shaped out of the CSV — column layout doesn't matter.
      const text = String(reader.result ?? "");
      const found = text.match(/0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44}/g) ?? [];
      setAddresses((prev) => (prev ? prev + "\n" : "") + found.join("\n"));
    };
    reader.readAsText(f);
  }

  async function submit() {
    if (selected === null) return setError("Create or pick a watchlist first.");
    const list = addresses.split(/[\s,;]+/).filter(Boolean);
    if (list.length === 0) return setError("Paste at least one address.");
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/watchlists/${selected}/wallets`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ addresses: list }),
      });
      const j = await res.json();
      if (!res.ok) setError(j.error ?? "Upload failed.");
      else {
        setResult(j.data);
        setAddresses("");
        await loadLists();
      }
    } catch {
      setError("Network error — try again.");
    }
    setBusy(false);
  }

  const parsedCount = addresses.split(/[\s,;]+/).filter(Boolean).length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <h1 className="text-xl font-bold tracking-tight">Wallet monitoring</h1>
      <p className="mt-0.5 text-xs text-faint">
        Add wallets that touch Visa systems. New addresses are queued and rated by the indexer; already-known wallets
        appear in the portfolio immediately.
      </p>

      {/* Watchlists */}
      <section className="mt-6 rounded-xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold">Watchlists</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {watchlists.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelected(w.id)}
              className="rounded-full border px-3.5 py-1.5 text-sm transition-colors"
              style={
                selected === w.id
                  ? { borderColor: "var(--accent)", color: "var(--accent-strong)", background: "rgba(64,102,255,0.08)" }
                  : { borderColor: "var(--border-strong)", color: "var(--muted)" }
              }
            >
              {w.name} <span className="text-xs opacity-70 tabular-nums">({w.wallet_count})</span>
            </button>
          ))}
          {watchlists.length === 0 && <span className="text-xs text-faint">No watchlists yet — create the first one:</span>}
        </div>
        <form onSubmit={createList} className="mt-3 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder='New watchlist, e.g. "Visa Direct counterparties"'
            className="flex-1 rounded-lg border border-line-strong bg-surface-2 px-3.5 py-2 text-sm placeholder:text-faint focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong transition-colors disabled:opacity-50"
          >
            Create
          </button>
        </form>
      </section>

      {/* Bulk add */}
      <section className="mt-4 rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Add wallets</h2>
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-medium text-muted hover:border-accent hover:text-accent-strong transition-colors"
          >
            Upload CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
        <textarea
          value={addresses}
          onChange={(e) => setAddresses(e.target.value)}
          rows={7}
          placeholder={"Paste addresses — one per line, or comma-separated. EVM (0x…) and Solana supported.\n0xd8da6bf26964af9d7eed9e03e53415d37aa96045\n0x2326d4fb2737666dda96bd6314e3d4418246cfe8"}
          className="mt-3 w-full rounded-lg border border-line-strong bg-surface-2 px-3.5 py-3 font-mono text-xs leading-relaxed placeholder:text-faint focus:outline-none focus:border-accent"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-faint tabular-nums">{parsedCount.toLocaleString()} addresses parsed · max 5,000 per upload</span>
          <button
            onClick={submit}
            disabled={busy || parsedCount === 0 || selected === null}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-strong transition-colors disabled:opacity-50"
          >
            {busy ? "Adding…" : "Add to watchlist"}
          </button>
        </div>

        {error && <p className="mt-3 text-sm" style={{ color: "var(--risk-high)" }}>{error}</p>}
        {result && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Valid addresses", value: result.valid },
              { label: "Invalid (skipped)", value: result.invalid },
              { label: "Added to watchlist", value: result.addedToWatchlist },
              { label: "Newly queued for rating", value: result.newlyQueuedForRating },
            ].map((x) => (
              <div key={x.label} className="rounded-lg border border-line bg-surface-2 px-3 py-2.5">
                <div className="text-lg font-bold tabular-nums">{x.value.toLocaleString()}</div>
                <div className="text-[10px] text-faint">{x.label}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="mt-4 text-[11px] leading-relaxed text-faint">
        Sources worth monitoring: wallets that on/off-ramp through Visa Direct, card-linked custodial withdrawals,
        settlement counterparties, and partner-reported user wallets. Rating happens automatically once queued.
      </p>
    </div>
  );
}
