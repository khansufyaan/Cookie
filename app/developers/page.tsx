import ApiPlayground from "@/components/ApiPlayground";

export const metadata = { title: "API — Halbrook" };

const INGEST_EXAMPLE = `curl -X POST https://halbrook.vercel.app/api/v1/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "appId": "your-app",
    "wallets": [
      {
        "address": "0xabc…def",
        "txCount": 42,
        "volumeUsd": 18500,
        "firstTx": "2024-11-02",
        "lastTx": "2026-06-21",
        "kycVerified": true
      }
    ]
  }'`;

const INGEST_RESPONSE = `{
  "data": {
    "appId": "your-app",
    "rated": 1,
    "results": [
      { "address": "0xabc…def", "grade": "B", "modifier": "+", "score": 662,
        "tier": "Verified", "archetype": "Regular", "ofacSanctioned": false }
    ]
  },
  "errors": [],
  "meta": { "engine": "halbrook-v0.3" }
}`;

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-surface-2 p-4 text-xs leading-relaxed font-mono text-muted">
      {children}
    </pre>
  );
}

export default function DevelopersPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pt-10">
      <h1 className="text-3xl font-bold tracking-tight">API</h1>
      <p className="mt-3 text-muted max-w-2xl">
        Two sides, one engine: pull ratings out, or push your users&apos; activity in. Score lookups read live
        Ethereum history, screen against the OFAC SDN snapshot, check KYC attestations, and include the monthly
        score timeline.
      </p>

      {/* Live playground */}
      <section className="mt-8">
        <div className="flex items-baseline gap-3 mb-3">
          <h2 className="font-semibold">Try it live</h2>
          <span className="text-xs text-faint">Real request, real chain data — no key required in beta</span>
        </div>
        <ApiPlayground />
      </section>

      <section className="mt-12">
        <div className="flex items-center gap-3">
          <span className="rounded bg-surface-2 border border-line-strong px-2 py-0.5 font-mono text-xs text-accent">GET</span>
          <h2 className="font-semibold font-mono text-sm sm:text-base">/api/v1/score/:address</h2>
        </div>
        <p className="mt-2 text-sm text-muted max-w-2xl">
          The read side. Returns score, grade, trust tier, factor decomposition, KYC + sanctions flags, totals, and
          <code className="font-mono text-xs"> history[]</code> — month-end score snapshots. Errors are explicit:
          <code className="font-mono text-xs"> 400</code> invalid address, <code className="font-mono text-xs">501</code>{" "}
          Solana (coverage in progress), <code className="font-mono text-xs">503</code> chain source unreachable.
        </p>
      </section>

      <section className="mt-12">
        <div className="flex items-center gap-3">
          <span className="rounded bg-surface-2 border border-line-strong px-2 py-0.5 font-mono text-xs text-accent">POST</span>
          <h2 className="font-semibold font-mono text-sm sm:text-base">/api/v1/ingest</h2>
        </div>
        <p className="mt-2 text-sm text-muted max-w-2xl">
          The write side. Report wallet activity in batches of up to 500 and receive tiered ratings back in the same
          call. Every submitted wallet is screened against the OFAC snapshot. Partners may assert{" "}
          <code className="font-mono text-xs">kycVerified</code> per wallet.
        </p>
        <Code>{INGEST_EXAMPLE}</Code>
        <Code>{INGEST_RESPONSE}</Code>
      </section>

      <section className="mt-12">
        <div className="flex items-center gap-3">
          <span className="rounded bg-surface-2 border border-line-strong px-2 py-0.5 font-mono text-xs text-accent">GET</span>
          <h2 className="font-semibold font-mono text-sm sm:text-base">/api/v1/stats</h2>
        </div>
        <p className="mt-2 text-sm text-muted">Live cumulative activity totals for every tracked contract.</p>
      </section>

      <section className="mt-12 mb-4 rounded-xl border border-line bg-surface p-6">
        <h2 className="font-semibold">Production roadmap</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted list-disc pl-5">
          <li>API keys + usage-based pricing for the read side; ingest is free (data is the payment).</li>
          <li>Full-universe indexer: every wallet that ever touched the tracked contracts, pre-rated.</li>
          <li>Webhooks: grade-change and sanctions-hit events pushed to subscribed apps.</li>
          <li>Attestations: EAS-based soulbound claims on Base with revoke-and-reissue portability.</li>
        </ul>
      </section>
    </div>
  );
}
