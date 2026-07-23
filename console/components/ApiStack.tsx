"use client";

import { useEffect, useState } from "react";

interface BusinessLine {
  id: number;
  name: string;
  api_key: string;
  model_id: number | null;
  model_name: string | null;
  model_version: number | null;
  watchlist_id: number | null;
  watchlist_name: string | null;
}
interface SavedModel { id: number; name: string; version: number }
interface Watchlist { id: number; name: string; wallet_count: number }

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-lg border border-line bg-surface-2 p-3.5 font-mono text-[11px] leading-relaxed text-muted">
      {children}
    </pre>
  );
}

export default function ApiStack() {
  const [lines, setLines] = useState<BusinessLine[]>([]);
  const [models, setModels] = useState<SavedModel[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [origin, setOrigin] = useState("https://visa-risk-console.vercel.app");

  async function load() {
    const [bl, m, w] = await Promise.all([
      fetch("/api/business-lines").then((r) => r.json()).catch(() => null),
      fetch("/api/models").then((r) => r.json()).catch(() => null),
      fetch("/api/watchlists").then((r) => r.json()).catch(() => null),
    ]);
    setLines(bl?.data ?? []);
    setModels(m?.data?.models ?? []);
    setWatchlists(w?.data ?? []);
  }
  useEffect(() => {
    load();
    setOrigin(window.location.origin);
  }, []);

  async function bind(id: number, patch: { modelId?: number; watchlistId?: number }) {
    await fetch("/api/business-lines", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    await load();
  }

  function copy(text: string, tag: string) {
    navigator.clipboard.writeText(text);
    setCopied(tag);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <h1 className="text-xl font-bold tracking-tight">API stack</h1>
      <p className="mt-0.5 max-w-2xl text-xs text-faint">
        The loop for internal customers: configure a model in the workbench, publish it, bind it to your business
        line — then call one endpoint and get answers under <em>your</em> risk policy.
      </p>

      {/* Business lines */}
      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {lines.map((l) => (
          <div key={l.id} className="rounded-xl border border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">{l.name}</h2>
              <span className="rounded border border-line-strong px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-faint">Internal customer</span>
            </div>

            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-faint">API key</p>
            <div className="mt-1 flex items-center gap-1.5">
              <code className="min-w-0 flex-1 truncate rounded-md border border-line bg-surface-2 px-2.5 py-1.5 font-mono text-[11px] text-muted">{l.api_key}</code>
              <button
                onClick={() => copy(l.api_key, `key-${l.id}`)}
                className="rounded-md border border-line-strong px-2.5 py-1.5 text-[11px] text-muted hover:border-accent hover:text-accent-strong transition-colors"
              >
                {copied === `key-${l.id}` ? "✓" : "Copy"}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">Risk model</p>
                <select
                  value={l.model_id ?? ""}
                  onChange={(e) => bind(l.id, { modelId: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md border border-line-strong bg-surface-2 px-2 py-1.5 text-[11px] focus:outline-none focus:border-accent"
                >
                  <option value="" disabled>Production baseline</option>
                  {models.map((m) => <option key={m.id} value={m.id}>{m.name} v{m.version}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-faint">Watchlist</p>
                <select
                  value={l.watchlist_id ?? ""}
                  onChange={(e) => bind(l.id, { watchlistId: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md border border-line-strong bg-surface-2 px-2 py-1.5 text-[11px] focus:outline-none focus:border-accent"
                >
                  <option value="" disabled>None bound</option>
                  {watchlists.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>
            <p className="mt-2.5 text-[11px] leading-relaxed text-faint">
              {l.model_name
                ? <>Scoring under <span className="text-accent-strong">{l.model_name} v{l.model_version}</span>.</>
                : "No model bound yet — calls score under the production baseline."}
            </p>
          </div>
        ))}
      </section>

      {/* The endpoint */}
      <section className="mt-8">
        <div className="flex items-center gap-3">
          <span className="rounded border border-line-strong bg-surface-2 px-2 py-0.5 font-mono text-xs text-accent-strong">GET</span>
          <h2 className="font-mono text-sm font-semibold">/api/v1/assess/:address</h2>
        </div>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted">
          One call, one answer, under your policy. Same wallet, different business lines, different verdicts — because
          each line scores under its own bound model. Unrated wallets are queued automatically and return{" "}
          <code className="font-mono">202</code>.
        </p>
        <Code>{`curl ${origin}/api/v1/assess/0x2326d4fb2737666dda96bd6314e3d4418246cfe8 \\
  -H "X-VRC-Key: ${lines[0]?.api_key ?? "vrc_live_…"}"

// 200 →
{
  "data": {
    "address": "0x2326d4…46cfe8",
    "score": 812,                      // under YOUR model, not ours
    "band": "low",                     // your thresholds decide
    "sanctioned": false,
    "kycVerified": true,
    "metrics": { "txCount": 723, "volumeUsd": 360742768, "appsUsed": 7 },
    "model": { "id": 1, "name": "Q3 conservative pilot", "version": 1 }
  },
  "meta": { "businessLine": "Visa Direct" }
}`}</Code>
        <p className="mt-2 text-[11px] text-faint">
          Per-call model override: append <code className="font-mono">?model=&lt;id&gt;</code> to A/B a candidate policy against production traffic.
        </p>
      </section>

      {/* Supporting endpoints */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold">Supporting endpoints</h2>
        <div className="mt-2 space-y-1.5">
          {[
            { m: "POST", p: "/api/watchlists/:id/wallets", d: "Bulk-add up to 5,000 addresses to monitoring (paste or CSV)." },
            { m: "GET", p: "/api/portfolio?watchlist=:id", d: "Raw observed metrics for a monitored set — score client-side under any levers." },
            { m: "GET", p: "/api/timeline?watchlist=:id", d: "Monthly score distributions for band-migration analysis." },
            { m: "POST", p: "/api/models", d: "Publish a model configuration (versioned, audited)." },
            { m: "POST", p: "/api/registry", d: "Add a contract, Visa-internal endpoint, or HSM wallet to monitoring." },
          ].map((e) => (
            <div key={e.p} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-lg border border-line bg-surface px-3.5 py-2.5">
              <span className="rounded border border-line-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-accent-strong">{e.m}</span>
              <code className="font-mono text-xs">{e.p}</code>
              <span className="text-[11px] text-faint">{e.d}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
