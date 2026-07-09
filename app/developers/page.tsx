import ApiPlayground from "@/components/ApiPlayground";

export const metadata = { title: "API — Visa Wallet Rating" };

const INGEST_EXAMPLE = `curl -X POST https://visa-wallet-rating.vercel.app/api/v1/ingest \\
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

const DATA_EVENTS_EXAMPLE = `POST /api/v1/ingest        // same endpoint — add an "events" array
{
  "appId": "your-app",
  "events": [
    { "type": "loan.outcome",     "wallet": "0xabc…", "observedAt": "2026-06-30",
      "payload": { "result": "repaid", "principalUsd": 25000, "daysLate": 0 } },

    { "type": "fraud.flag",       "wallet": "0xdef…", "observedAt": "2026-07-01",
      "payload": { "reason": "sybil_cluster", "clusterSize": 40, "action": "banned" } },

    { "type": "payment.chargeback", "wallet": "0x123…", "observedAt": "2026-07-02",
      "payload": { "amountUsd": 480, "railType": "card_onramp" } },

    { "type": "kyc.attestation",  "wallet": "0x456…", "observedAt": "2026-05-11",
      "payload": { "status": "passed", "level": "full", "method": "eas", "uid": "0x…" } },

    { "type": "custodial.mapping", "wallet": "0x789…", "observedAt": "2026-07-01",
      "payload": { "kind": "omnibus_pool", "label": "hot-wallet-3" } }
  ]
}`;

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
  "meta": { "engine": "vwr-v0.4" }
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
          The read side. Returns score, grade, trust tier, factor decomposition, named app activity, stablecoin mix,
          KYC + sanctions flags, totals, and <code className="font-mono text-xs">history[]</code> — month-end score
          snapshots. Ethereum and Solana are both live. Errors are explicit:{" "}
          <code className="font-mono text-xs">400</code> invalid address,{" "}
          <code className="font-mono text-xs">503</code> chain source unreachable.
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

      {/* Data partnership — the give-to-get model */}
      <section className="mt-14 rounded-2xl border-2 p-6 sm:p-8" style={{ borderColor: "var(--accent)" }}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold tracking-tight">Report data, read free</h2>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">Data partnership</span>
        </div>
        <p className="mt-3 text-sm text-muted max-w-2xl leading-relaxed">
          The rating gets smarter with data only apps have — what happened <em>after</em> the transaction. Partners
          who report qualifying off-chain data get the read API <strong className="text-foreground">free at the
          Growth tier</strong>, credit-bureau style: contributors read the network&apos;s pooled signal at no cost;
          non-contributors pay per call.
        </p>

        <h3 className="mt-6 font-semibold text-sm">What to send us</h3>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {[
            { t: "Outcomes", d: "Loan repaid / defaulted / liquidated; trade settled or reversed — the labels no chain scan contains." },
            { t: "Fraud & abuse flags", d: "Accounts you banned, Sybil clusters you caught, phishing or exploit wallets you traced." },
            { t: "Payment results", d: "Fiat chargebacks, failed off-ramps, refund abuse tied to a wallet." },
            { t: "Identity attestations", d: "Your own KYC pass/fail per wallet (asserted, or as an EAS attestation we verify)." },
            { t: "Custodial mappings", d: "Which of your omnibus addresses are pools vs. user wallets, so deposits are never misread." },
            { t: "App activity", d: "Off-chain or L2 usage we can't see: sessions, order flow, loyalty status per wallet." },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-line bg-surface px-4 py-3">
              <div className="font-semibold text-sm">{x.t}</div>
              <p className="mt-1 text-xs text-muted leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-6 font-semibold text-sm">One envelope for every event type</h3>
        <p className="mt-1 text-xs text-muted max-w-2xl">
          Ingest accepts a typed event stream — same endpoint, same shape, open vocabulary. Send what you have;
          fields you don&apos;t have, omit. New event types don&apos;t require an API change.
        </p>
        <Code>{DATA_EVENTS_EXAMPLE}</Code>
        <p className="mt-2 text-xs text-faint">
          Every event: <code className="font-mono">type</code> + <code className="font-mono">wallet</code> +{" "}
          <code className="font-mono">observedAt</code> + a type-specific <code className="font-mono">payload</code>.
          Reported data feeds the network model; it is never resold row-level.
        </p>
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
