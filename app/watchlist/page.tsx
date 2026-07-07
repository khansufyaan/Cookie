"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "halbrook-watchlist";
const EVM_RE = /^0x[0-9a-fA-F]{40}$/;
const SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

interface Row {
  address: string;
  loading: boolean;
  score?: number;
  grade?: string;
  tier?: string;
  error?: string;
}

export default function WatchlistPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved: string[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    setRows(saved.map((address) => ({ address, loading: true })));
    saved.forEach(load);
  }, []);

  async function load(address: string) {
    try {
      const res = await fetch(`/api/v1/score/${address}`);
      const json = await res.json();
      setRows((rs) =>
        rs.map((r) =>
          r.address === address
            ? res.ok
              ? { address, loading: false, score: json.data.score, grade: `${json.data.grade}${json.data.modifier}`, tier: json.data.tier }
              : { address, loading: false, error: json.error ?? "Unavailable" }
            : r,
        ),
      );
    } catch {
      setRows((rs) => rs.map((r) => (r.address === address ? { ...r, loading: false, error: "Network error" } : r)));
    }
  }

  function persist(addresses: string[]) {
    localStorage.setItem(KEY, JSON.stringify(addresses));
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    const addr = input.trim();
    const norm = EVM_RE.test(addr) ? addr.toLowerCase() : addr;
    if (!EVM_RE.test(addr) && !SOL_RE.test(addr)) {
      setError("Enter a valid EVM (0x…) or Solana address.");
      return;
    }
    if (rows.some((r) => r.address === norm)) {
      setError("Already on your watchlist.");
      return;
    }
    setError("");
    setInput("");
    setRows((rs) => {
      const next = [...rs, { address: norm, loading: true }];
      persist(next.map((r) => r.address));
      return next;
    });
    load(norm);
  }

  function remove(address: string) {
    setRows((rs) => {
      const next = rs.filter((r) => r.address !== address);
      persist(next.map((r) => r.address));
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-5 pt-10">
      <h1 className="text-3xl font-bold tracking-tight">Watchlist</h1>
      <p className="mt-2 text-sm text-muted max-w-2xl">
        Monitor wallets you care about — counterparties, treasury addresses, your own. Ratings refresh on every
        visit. Stored in this browser; account sync and grade-change alerts ship with API keys.
      </p>

      <form onSubmit={add} className="mt-6 flex gap-2 max-w-xl">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="0x… or Solana wallet address"
          spellCheck={false}
          className="flex-1 rounded-lg border border-line-strong bg-surface px-4 py-2.5 font-mono text-sm placeholder:text-faint focus:outline-none focus:border-accent"
        />
        <button type="submit" className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-strong transition-colors">
          Watch
        </button>
      </form>
      {error && <p className="mt-2 text-sm" style={{ color: "var(--grade-c)" }}>{error}</p>}

      <div className="mt-8 overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-faint border-b border-line bg-surface">
              <th className="px-4 py-3">Wallet</th>
              <th className="px-4 py-3 text-right">Rating</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3 text-right">Tier</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Nothing watched yet. Add a wallet above.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.address} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/wallet/${r.address}`} className="font-mono text-xs text-accent hover:text-accent-strong break-all">
                    {r.address.slice(0, 12)}…{r.address.slice(-6)}
                  </Link>
                </td>
                {r.loading ? (
                  <td colSpan={3} className="px-4 py-3 text-right text-faint animate-pulse">Rating…</td>
                ) : r.error ? (
                  <td colSpan={3} className="px-4 py-3 text-right text-faint">{r.error}</td>
                ) : (
                  <>
                    <td className="px-4 py-3 text-right font-bold" style={{ color: `var(--grade-${r.grade![0].toLowerCase()})` }}>{r.grade}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{r.score}</td>
                    <td className="px-4 py-3 text-right text-muted">{r.tier}</td>
                  </>
                )}
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(r.address)} className="text-xs text-faint hover:text-foreground" aria-label={`Remove ${r.address}`}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
