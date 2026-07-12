import ApiPlayground from "@/components/ApiPlayground";
import ApiTabs from "@/components/ApiTabs";

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

const WEBHOOK_EXAMPLE = `curl -X POST https://visa-wallet-rating.vercel.app/api/v1/webhooks \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-app.com/hooks/vwr",
    "events": ["grade.changed", "sanctions.listed"]
  }'

// → { "data": { "id": 1, "secret": "whsec_…" } }   secret shown once`;

const WEBHOOK_DELIVERY = `POST https://your-app.com/hooks/vwr      // what we send you
X-VWR-Event: grade.changed
X-VWR-Signature: hmac-sha256(secret, body)

{
  "event": "grade.changed",
  "timestamp": "2026-07-10T04:12:00Z",
  "data": { "wallet": "0xabc…", "from": "B+", "to": "A-", "score": 815 }
}`;

const WEBHOOK_VERIFY = `// verify every delivery came from us (Node)
import crypto from "node:crypto";

const sig = req.headers["x-vwr-signature"];
const expected = crypto
  .createHmac("sha256", process.env.VWR_WEBHOOK_SECRET) // the whsec_… from subscribe
  .update(rawBody)
  .digest("hex");
if (sig !== expected) return res.status(401).end();     // reject forgeries`;

const MCP_CONFIG = `// claude_desktop_config.json  (Claude Desktop / Cursor / Claude Code)
{
  "mcpServers": {
    "visa-wallet-rating": {
      "command": "node",
      "args": ["/path/to/mcp/server.mjs"],
      "env": { "VWR_API_KEY": "hb_live_…" }
    }
  }
}`;

const MCP_ASK = `You: "Is 0x0330…e54a safe to pay?"
Claude → check_sanctions → ⛔ SANCTIONED — do not transact.

You: "Rate wallet 0x2326…cfe8"
Claude → rate_wallet → A+ · 990/1000 · Blue Chip, not sanctioned.`;

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-surface-2 p-4 text-xs leading-relaxed font-mono text-muted">
      {children}
    </pre>
  );
}

/* ---------- FREE tab: report your data, everything's free ---------- */

function FreeDocs() {
  return (
    <div>
      <section className="rounded-2xl border-2 p-6 sm:p-8" style={{ borderColor: "var(--accent)" }}>
        <h2 className="text-xl font-bold tracking-tight">How the free tier works</h2>
        <p className="mt-3 text-sm text-muted max-w-2xl leading-relaxed">
          Your app&apos;s users have wallets. When those wallets interact with your app, you see things the chain
          can&apos;t — report that, and everything here is free.
        </p>

        <h3 className="mt-6 font-semibold text-sm">What to send us</h3>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {[
            { t: "Outcomes", d: "Loan repaid / defaulted / liquidated; trade settled or reversed." },
            { t: "Fraud & abuse flags", d: "Accounts you banned, Sybil clusters, exploit wallets." },
            { t: "Payment results", d: "Fiat chargebacks, failed off-ramps, refund abuse." },
            { t: "Identity attestations", d: "Your own KYC pass/fail per wallet." },
            { t: "Custodial mappings", d: "Which of your addresses are pools vs. user wallets." },
            { t: "App activity", d: "Off-chain or L2 usage we can't see from the chain." },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-line bg-surface px-4 py-3">
              <div className="font-semibold text-sm">{x.t}</div>
              <p className="mt-1 text-xs text-muted leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center gap-3">
          <span className="rounded bg-surface-2 border border-line-strong px-2 py-0.5 font-mono text-xs text-accent">POST</span>
          <h2 className="font-semibold font-mono text-sm sm:text-base">/api/v1/ingest</h2>
        </div>
        <p className="mt-2 text-sm text-muted max-w-2xl">
          Report wallet activity in batches of up to 500 and receive ratings back in the same call. Every wallet is
          screened against the OFAC snapshot.
        </p>
        <Code>{INGEST_EXAMPLE}</Code>
        <Code>{INGEST_RESPONSE}</Code>
      </section>

      <section className="mt-10">
        <h3 className="font-semibold text-sm">One envelope for every off-chain event</h3>
        <p className="mt-1 text-xs text-muted max-w-2xl">
          Same endpoint, open vocabulary — send what you have, omit what you don&apos;t. New event types need no API
          change.
        </p>
        <Code>{DATA_EVENTS_EXAMPLE}</Code>
        <p className="mt-2 text-xs text-faint">
          Reported data feeds the network model; it is never resold row-level.
        </p>
      </section>
    </div>
  );
}

/* ---------- PAID tab: read APIs + webhooks + live test ---------- */

function PaidDocs() {
  return (
    <div>
      <section>
        <div className="flex items-baseline gap-3 mb-3">
          <h2 className="font-semibold">Try it live</h2>
          <span className="text-xs text-faint">Real request, real chain data</span>
        </div>
        <ApiPlayground />
      </section>

      <section className="mt-10">
        <div className="flex items-center gap-3">
          <span className="rounded bg-surface-2 border border-line-strong px-2 py-0.5 font-mono text-xs text-accent">GET</span>
          <h2 className="font-semibold font-mono text-sm sm:text-base">/api/v1/score/:address</h2>
        </div>
        <p className="mt-2 text-sm text-muted max-w-2xl">
          Score, grade, trust tier, factor decomposition, named app activity, stablecoin mix, KYC + sanctions flags,
          totals, and <code className="font-mono text-xs">history[]</code> — month-end snapshots. Ethereum and
          Solana. Errors: <code className="font-mono text-xs">400</code> invalid address,{" "}
          <code className="font-mono text-xs">503</code> chain source unreachable.
        </p>
      </section>

      <section className="mt-10">
        <div className="flex items-center gap-3">
          <span className="rounded bg-surface-2 border border-line-strong px-2 py-0.5 font-mono text-xs text-accent">GET</span>
          <h2 className="font-semibold font-mono text-sm sm:text-base">/api/v1/stats</h2>
        </div>
        <p className="mt-2 text-sm text-muted">Live cumulative activity totals for every tracked contract.</p>
      </section>
    </div>
  );
}

/* ---------- Webhooks — shared: available on every tier ---------- */

function WebhooksSection() {
  return (
    <section id="webhooks" className="mt-16 scroll-mt-20 border-t border-line pt-12">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold tracking-tight">Webhooks</h2>
        <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">On every tier</span>
      </div>
      <p className="mt-3 text-sm text-muted max-w-2xl leading-relaxed">
        Don&apos;t poll — we notify you. Subscribe a URL once and we push an event the moment a wallet you care about
        crosses a threshold: <code className="font-mono text-xs">grade.changed</code> when the rating engine re-scores
        it, and <code className="font-mono text-xs">sanctions.listed</code> the moment it lands on an OFAC list. This is
        how you re-screen a counterparty <em>after</em> onboarding without re-querying — the pass stays current, and so
        do you.
      </p>

      <h3 className="mt-8 font-semibold text-sm">1 · Subscribe a URL</h3>
      <Code>{WEBHOOK_EXAMPLE}</Code>

      <h3 className="mt-8 font-semibold text-sm">2 · Receive signed deliveries</h3>
      <Code>{WEBHOOK_DELIVERY}</Code>

      <h3 className="mt-8 font-semibold text-sm">3 · Verify the signature</h3>
      <p className="mt-1 text-xs text-muted max-w-2xl">
        Every delivery carries an HMAC-SHA256 signature of the raw body, keyed by the{" "}
        <code className="font-mono text-xs">whsec_…</code> secret returned once at subscribe time. Check it before you
        trust the payload.
      </p>
      <Code>{WEBHOOK_VERIFY}</Code>
      <p className="mt-2 text-xs text-faint">
        Unsubscribe any time: <code className="font-mono text-xs">DELETE /api/v1/webhooks</code> with the subscription id.
      </p>
    </section>
  );
}

/* ---------- MCP — let any AI agent read the ratings ---------- */

function McpSection() {
  return (
    <section id="mcp" className="mt-16 scroll-mt-20 border-t border-line pt-12">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold tracking-tight">MCP server</h2>
        <span className="rounded-full border border-line-strong px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-faint">New</span>
      </div>
      <p className="mt-3 text-sm text-muted max-w-2xl leading-relaxed">
        The rating isn&apos;t just an API — it&apos;s a tool your AI agents can call. Drop our{" "}
        <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="text-accent underline">Model Context Protocol</a>{" "}
        server into Claude Desktop, Cursor, or Claude Code and your assistant can rate a wallet or screen a
        counterparty in plain language — before it signs, pays, or onboards.
      </p>

      <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
        {[
          { t: "rate_wallet", d: "Full A/B/C/F rating: score, factors, apps used, stablecoin mix, totals." },
          { t: "check_sanctions", d: "One-address OFAC screen with a clear SANCTIONED / clear verdict." },
          { t: "network_stats", d: "Live coverage: monitored contracts + rated-wallet universe." },
        ].map((x) => (
          <div key={x.t} className="rounded-xl border border-line bg-surface px-4 py-3">
            <div className="font-mono text-sm font-semibold text-accent">{x.t}</div>
            <p className="mt-1 text-xs text-muted leading-relaxed">{x.d}</p>
          </div>
        ))}
      </div>

      <h3 className="mt-8 font-semibold text-sm">Add it to your client</h3>
      <Code>{MCP_CONFIG}</Code>

      <h3 className="mt-8 font-semibold text-sm">Then just ask</h3>
      <Code>{MCP_ASK}</Code>
      <p className="mt-2 text-xs text-faint">
        Stateless relay over the read API — your <code className="font-mono text-xs">hb_live_…</code> key meters it; no
        chain keys or data ever leave our servers. Setup lives in the repo under{" "}
        <code className="font-mono text-xs">mcp/</code>.
      </p>
    </section>
  );
}

export default function DevelopersPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pt-10 pb-8">
      <h1 className="text-3xl font-bold tracking-tight">API</h1>
      <p className="mt-3 text-muted max-w-2xl">Two prices. Pick your side:</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <a href="#webhooks" className="rounded-full border border-line-strong px-3 py-1 font-medium text-muted hover:border-accent hover:text-accent">Webhooks →</a>
        <a href="#mcp" className="rounded-full border border-line-strong px-3 py-1 font-medium text-muted hover:border-accent hover:text-accent">MCP server →</a>
      </div>

      <ApiTabs free={<FreeDocs />} paid={<PaidDocs />} />

      <WebhooksSection />
      <McpSection />
    </div>
  );
}
