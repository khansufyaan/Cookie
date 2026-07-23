"use client";

import { useState } from "react";

interface Evidence {
  kind: "withdrawal" | "deposit" | "attestation";
  entity: string;
  tier: "us-only" | "us-regulated";
  weight: number;
  detail: string;
  txHash?: string;
  date?: string;
}
interface Result {
  address: string;
  verdict: "likely-us" | "possible-us" | "us-regulated-only" | "no-signal";
  verdictLabel: string;
  summary: string;
  probability: number;
  usResidentOnlySignal: boolean;
  evidence: Evidence[];
  scanned: { incoming: number; outgoing: number };
}

const VERDICT_COLOR: Record<Result["verdict"], string> = {
  "likely-us": "var(--risk-high)",
  "possible-us": "var(--risk-elevated)",
  "us-regulated-only": "var(--risk-elevated)",
  "no-signal": "var(--risk-low)",
};

const SAMPLES = [
  { label: "Coinbase hot wallet", addr: "0x71660c4005ba85c37ccec55d0c4493e66fe775d3" },
  { label: "vitalik.eth", addr: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045" },
];

export default function GeoChecker() {
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [caveats, setCaveats] = useState<string[]>([]);
  const [method, setMethod] = useState("");

  async function run(addr?: string) {
    const target = (addr ?? address).trim();
    if (!target) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/us-exposure/${target}`);
      const j = await res.json();
      if (!res.ok) setError(j.error ?? "Lookup failed.");
      else {
        setResult(j.data);
        setCaveats(j.meta?.caveats ?? []);
        setMethod(j.meta?.method ?? "");
      }
    } catch {
      setError("Network error — try again.");
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight">US exposure check</h1>
      <p className="mt-1.5 max-w-2xl text-sm text-muted">
        Enter a wallet. We scan its Ethereum history for interactions with US-regulated exchanges to estimate whether
        the owner is a US person — the signal a CLARITY-style geoblock would rely on.
      </p>

      <div className="mt-6 flex gap-2">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="0x… wallet address"
          className="flex-1 rounded-xl border border-line-strong bg-surface px-4 py-3 font-mono text-sm placeholder:text-faint focus:outline-none focus:border-accent"
        />
        <button
          onClick={() => run()}
          disabled={busy || !address.trim()}
          className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-strong transition-colors disabled:opacity-50"
        >
          {busy ? "Scanning…" : "Check"}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
        <span className="text-faint">Try:</span>
        {SAMPLES.map((s) => (
          <button key={s.addr} onClick={() => { setAddress(s.addr); run(s.addr); }} className="text-accent-strong hover:underline">
            {s.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm" style={{ color: "var(--risk-high)" }}>{error}</p>}

      {result && (
        <div className="mt-6">
          {/* Verdict banner */}
          <div className="rounded-2xl border p-6" style={{ borderColor: VERDICT_COLOR[result.verdict] }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-2xl font-bold" style={{ color: VERDICT_COLOR[result.verdict] }}>
                  {result.verdictLabel}
                </div>
                <p className="mt-1 max-w-lg text-sm text-muted">{result.summary}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold tabular-nums">{Math.round(result.probability * 100)}%</div>
                <div className="text-[11px] text-faint">US likelihood</div>
              </div>
            </div>
            {/* Probability bar */}
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${result.probability * 100}%`, background: VERDICT_COLOR[result.verdict] }} />
            </div>
            {result.usResidentOnlySignal && (
              <p className="mt-3 text-xs font-semibold" style={{ color: "var(--risk-high)" }}>
                ⚑ Interacted with a US-resident-only venue (Binance.US) — near-definitive US residency.
              </p>
            )}
          </div>

          {/* Evidence */}
          <h2 className="mt-6 text-sm font-semibold">Evidence <span className="text-faint font-normal">({result.evidence.length})</span></h2>
          {result.evidence.length === 0 ? (
            <p className="mt-2 rounded-xl bg-surface px-5 py-4 text-sm text-muted">
              No interactions with tracked US exchanges found across {(result.scanned.incoming + result.scanned.outgoing).toLocaleString()} transfers.
              This is not proof of non-US status.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {result.evidence.map((e, i) => (
                <div key={i} className="flex items-center justify-between gap-4 rounded-xl bg-surface px-5 py-3.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{e.entity}</span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                        style={e.tier === "us-only"
                          ? { color: "var(--risk-high)", border: "1px solid var(--risk-high)" }
                          : { color: "var(--muted)", border: "1px solid var(--border-strong)" }}
                      >
                        {e.tier === "us-only" ? "US-only" : "US-regulated"}
                      </span>
                      <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-faint">{e.kind}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {e.detail}{e.date && ` · ${e.date}`}
                      {e.txHash && (
                        <a href={`https://etherscan.io/tx/${e.txHash}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-accent-strong hover:underline">
                          tx ↗
                        </a>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold tabular-nums">{Math.round(e.weight * 100)}%</div>
                    <div className="text-[10px] text-faint">confidence</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Method + honest caveats */}
          <details className="group mt-6 rounded-xl bg-surface px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold [&::-webkit-details-marker]:hidden">
              How this works &amp; what it can&apos;t tell you
              <span className="text-faint transition-transform group-open:rotate-90">›</span>
            </summary>
            <p className="mt-3 text-xs leading-relaxed text-muted">{method}</p>
            <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-faint">
              {caveats.map((c, i) => <li key={i}>· {c}</li>)}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}
