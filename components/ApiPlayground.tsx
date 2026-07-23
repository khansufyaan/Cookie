"use client";

import { useState } from "react";

const SAMPLE = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // vitalik.eth

/** Live API explorer: send a real request to /api/v1/score and view the response. */
export default function ApiPlayground() {
  const [address, setAddress] = useState(SAMPLE);
  const [status, setStatus] = useState<string | null>(null);
  const [ms, setMs] = useState<number | null>(null);
  const [body, setBody] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    setBody(null);
    setStatus(null);
    const t0 = performance.now();
    try {
      const res = await fetch(`/api/v1/score/${address.trim()}`);
      setMs(Math.round(performance.now() - t0));
      setStatus(`${res.status} ${res.ok ? "OK" : res.statusText}`);
      const json = await res.json();
      setBody(JSON.stringify(json, null, 2));
    } catch {
      setMs(Math.round(performance.now() - t0));
      setStatus("Network error");
      setBody("The request could not be completed.");
    } finally {
      setLoading(false);
    }
  }

  const curl = `curl https://visa-wallet-rating.vercel.app/api/v1/score/${address.trim() || "<address>"}`;

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <div className="border-b border-line px-5 py-3 flex items-center gap-3">
        <span className="rounded bg-surface-2 border border-line-strong px-2 py-0.5 font-mono text-xs text-accent">GET</span>
        <span className="font-mono text-sm text-muted">/api/v1/score/</span>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          spellCheck={false}
          className="flex-1 min-w-0 bg-transparent font-mono text-sm focus:outline-none"
          aria-label="Address to score"
        />
        <button
          onClick={send}
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent-strong transition-colors disabled:opacity-60"
        >
          {loading ? "Running…" : "Send"}
        </button>
      </div>

      <div className="px-5 py-3 border-b border-line bg-surface-2">
        <code className="font-mono text-xs text-muted break-all">{curl}</code>
      </div>

      <div className="px-5 py-4 min-h-[120px]">
        {status && (
          <p className="text-xs font-semibold mb-2" style={{ color: status.startsWith("200") ? "var(--grade-a)" : "var(--grade-c)" }}>
            {status}
            {ms !== null && <span className="ml-2 font-normal text-faint">{ms} ms · live request</span>}
          </p>
        )}
        {!body && !loading && (
          <p className="text-sm text-faint">
            Press <span className="font-medium text-muted">Send</span> to run a real request against live chain data.
            The sample address is vitalik.eth.
          </p>
        )}
        {loading && <p className="text-sm text-faint animate-pulse">Reading full on-chain history…</p>}
        {body && (
          <pre className="overflow-auto max-h-96 rounded-lg border border-line bg-surface-2 p-4 text-xs leading-relaxed font-mono text-muted">
            {body}
          </pre>
        )}
      </div>
    </div>
  );
}
