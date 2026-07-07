export const metadata = { title: "API — Cookie" };

const SCORE_EXAMPLE = `curl https://<host>/api/v1/score/0x1f9090aae28b8a3dceadf281b0f12828e676c326`;

const SCORE_RESPONSE = `{
  "data": {
    "address": "0x1f90…c326",
    "family": "evm",
    "score": 741,
    "grade": "A",
    "modifier": "-",
    "tier": "Prime",
    "archetype": "Blue Chip",
    "kyc": { "verified": true, "source": "Coinbase Verifications attestation (EAS on Base)" },
    "sanctions": { "listed": false, "list": "OFAC SDN (digital currency addresses)" },
    "factors": [
      { "key": "usage", "points": 201, "weight": 0.25, "detail": "…" },
      …
    ],
    "totals": { "txCount": 863, "volumeUsd": 1204551, "appsUsed": 4, … }
  },
  "meta": { "engine": "crumb-v0.2", "dataSource": "live" }
}`;

const INGEST_EXAMPLE = `curl -X POST https://<host>/api/v1/ingest \\
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
      { "address": "0xabc…def", "grade": "B", "modifier": "+", "score": 662, "tier": "Verified", "archetype": "Regular", "ofacSanctioned": false }
    ]
  },
  "errors": [],
  "meta": { "engine": "crumb-v0.2", "tier": "demo" }
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
        Cookie is a two-sided marketplace: apps push wallet activity in, and pull ratings out. Score lookups for
        EVM addresses read live Ethereum mainnet data; every request is screened against the OFAC SDN snapshot and
        checked for a KYC attestation. No auth in the MVP; ingest is stateless.
      </p>

      <section className="mt-10">
        <div className="flex items-center gap-3">
          <span className="rounded bg-surface-2 border border-line-strong px-2 py-0.5 font-mono text-xs text-accent">GET</span>
          <h2 className="font-semibold font-mono text-sm sm:text-base">/api/v1/score/:address</h2>
        </div>
        <p className="mt-2 text-sm text-muted">
          The read side. Returns the full CRUMB rating for any EVM address: score, grade, factor decomposition,
          totals, and attestation status.
        </p>
        <Code>{SCORE_EXAMPLE}</Code>
        <Code>{SCORE_RESPONSE}</Code>
      </section>

      <section className="mt-12">
        <div className="flex items-center gap-3">
          <span className="rounded bg-surface-2 border border-line-strong px-2 py-0.5 font-mono text-xs text-accent">POST</span>
          <h2 className="font-semibold font-mono text-sm sm:text-base">/api/v1/ingest</h2>
        </div>
        <p className="mt-2 text-sm text-muted">
          The write side. Report your users&apos; activity in batches of up to 500 wallets and receive A/B/C ratings
          back in the same call. In production this persists to the Cookie graph and merges with cross-app history;
          in the demo tier the batch is rated statelessly.
        </p>
        <Code>{INGEST_EXAMPLE}</Code>
        <Code>{INGEST_RESPONSE}</Code>
      </section>

      <section className="mt-12">
        <div className="flex items-center gap-3">
          <span className="rounded bg-surface-2 border border-line-strong px-2 py-0.5 font-mono text-xs text-accent">GET</span>
          <h2 className="font-semibold font-mono text-sm sm:text-base">/api/v1/stats</h2>
        </div>
        <p className="mt-2 text-sm text-muted">Aggregate network statistics: population, grade distribution, per-app activity.</p>
      </section>

      <section className="mt-12 rounded-xl border border-line bg-surface p-6">
        <h2 className="font-semibold">Production roadmap</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted list-disc pl-5">
          <li>API keys + usage-based pricing for the read side; ingest is free (data is the payment).</li>
          <li>Indexer: on-chain backfill of the five launch-app contracts replaces synthesized profiles.</li>
          <li>Webhooks: grade-change events pushed to subscribed apps.</li>
          <li>Attestations: EAS-based soulbound claims on Base, opt-in, with revoke-and-reissue portability.</li>
        </ul>
      </section>
    </div>
  );
}
