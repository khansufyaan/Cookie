#!/usr/bin/env node
/**
 * Visa Wallet Rating — MCP server.
 *
 * Exposes the wallet-rating service to any Model Context Protocol client
 * (Claude Desktop, Cursor, etc.) as three tools:
 *   • rate_wallet    — full A/B/C/F rating with score, factors, apps, stablecoins
 *   • check_sanctions — OFAC screen for a single address (compliance shortcut)
 *   • network_stats  — live coverage: monitored contracts + rated-wallet universe
 *
 * It is a thin, stateless relay over the hosted HTTP API — no chain keys, no
 * database, no scoring logic lives here, so the "secret sauce" (data sources)
 * never leaves the server. If the site is behind its password gate, this
 * server authenticates once via that password and reuses the session cookie.
 *
 * Config (environment variables):
 *   VWR_BASE_URL   Base URL of the service. Default: https://visa-wallet-rating.vercel.app
 *   VWR_PASSWORD   Site gate password (only if the site is password-protected).
 *   VWR_API_KEY    Optional `hb_...` API key for a higher metered tier.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const BASE_URL = (process.env.VWR_BASE_URL || "https://visa-wallet-rating.vercel.app").replace(/\/$/, "");
const PASSWORD = process.env.VWR_PASSWORD || "";
const API_KEY = process.env.VWR_API_KEY || "";

let gateCookie = null; // cached "vwr_gate=..." once authenticated

/** Authenticate through the site gate (if enabled) and cache the cookie. */
async function authenticate() {
  if (!PASSWORD) return; // gate disabled — nothing to do
  const res = await fetch(`${BASE_URL}/api/gate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: PASSWORD }),
    redirect: "manual",
  });
  if (res.status === 401) throw new Error("VWR_PASSWORD is wrong — the site gate rejected it.");
  const cookies = typeof res.headers.getSetCookie === "function"
    ? res.headers.getSetCookie()
    : [res.headers.get("set-cookie")].filter(Boolean);
  const gate = cookies.map((c) => c.split(";")[0]).find((c) => c.startsWith("vwr_gate="));
  if (gate) gateCookie = gate;
}

/** GET a service endpoint, transparently re-authenticating through the gate. */
async function apiGet(path) {
  const url = `${BASE_URL}${path}`;
  const headers = {};
  if (API_KEY) headers["authorization"] = `Bearer ${API_KEY}`;

  const call = () => {
    const h = { ...headers };
    if (gateCookie) h["cookie"] = gateCookie;
    return fetch(url, { headers: h, redirect: "manual" });
  };

  let res = await call();
  // A redirect (307/302) means the gate bounced us to the login page.
  if ((res.status >= 300 && res.status < 400) || res.status === 401) {
    await authenticate();
    res = await call();
  }
  if (res.status >= 300 && res.status < 400) {
    throw new Error("Blocked by the site password gate. Set VWR_PASSWORD in the MCP config.");
  }

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Service returned a non-JSON response (${res.status}). Check VWR_BASE_URL.`);
  }
  if (!res.ok) {
    throw new Error(json?.error || `Request failed (${res.status}).`);
  }
  return json;
}

// ---- Formatting helpers (concise, human-readable tool output) ----

function money(n) {
  if (typeof n !== "number" || !isFinite(n)) return "—";
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function summarizeRating(json) {
  const d = json?.data ?? {};
  if (d.entityType === "custodial_pool") {
    return `**${d.label || "Custodial pool"}** — known custodial/omnibus address. No wallet-level grade is issued (transfers carry no end-user signal).`;
  }
  const grade = `${d.grade ?? "?"}${d.modifier ?? ""}`;
  const lines = [];
  lines.push(`**Rating: ${grade}**  ·  Score ${d.score ?? "—"} / 1000`);
  if (d.address) lines.push(`Wallet: \`${d.address}\``);
  if (d.archetype || d.tier) lines.push(`Profile: ${d.archetype ?? d.tier}`);
  if (d.sanctions) {
    lines.push(d.sanctions.listed ? "⛔ **SANCTIONED — appears on an OFAC list.**" : "✓ Not on any sanctions list.");
  }
  if (d.totals) {
    lines.push(`Activity: ${d.totals.txCount ?? 0} txns · ${money(d.totals.volumeUsd)} volume · ${money(d.averageTransactionUsd)} avg txn`);
  }
  if (Array.isArray(d.apps) && d.apps.length) {
    const names = d.apps.slice(0, 8).map((a) => a.name).join(", ");
    lines.push(`Apps used: ${names}${d.apps.length > 8 ? ` +${d.apps.length - 8} more` : ""}`);
  }
  if (Array.isArray(d.stablecoins) && d.stablecoins.length) {
    lines.push(`Stablecoins: ${d.stablecoins.map((s) => s.asset).join(", ")}`);
  }
  if (json?.meta?.note) lines.push(`\n_${json.meta.note}_`);
  return lines.join("\n");
}

function summarizeSanctions(json) {
  const d = json?.data ?? {};
  if (d.entityType === "custodial_pool") {
    return `\`${d.label || "custodial pool"}\` — known custodial address; screened separately, no individual grade.`;
  }
  const s = d.sanctions ?? {};
  if (s.listed) {
    return `⛔ SANCTIONED. This address matches an OFAC sanctions listing. Do not transact.${s.source ? ` (source: ${s.source})` : ""}`;
  }
  return "✓ Clear. This address does not appear on the screened sanctions lists.";
}

function summarizeStats(json) {
  const d = json?.data ?? {};
  const lines = [];
  lines.push(`**Live coverage**`);
  if (typeof d.totalTx === "number") lines.push(`Monitored transactions across all contracts: ${d.totalTx.toLocaleString("en-US")}`);
  if (Array.isArray(d.contracts)) lines.push(`Monitored smart contracts: ${d.contracts.length}`);
  if (d.universe && typeof d.universe === "object") {
    const u = d.universe;
    const bits = [];
    if (u.discovered != null) bits.push(`${Number(u.discovered).toLocaleString("en-US")} discovered`);
    if (u.rated != null) bits.push(`${Number(u.rated).toLocaleString("en-US")} rated`);
    if (bits.length) lines.push(`Wallet universe: ${bits.join(" · ")}`);
  }
  return lines.join("\n");
}

// ---- MCP server ----

const server = new Server(
  { name: "visa-wallet-rating", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

const TOOLS = [
  {
    name: "rate_wallet",
    description:
      "Rate a crypto wallet from its live on-chain history. Returns a Visa Wallet Rating grade (A/B/C, or F if sanctioned), a 0–1000 score, the scoring factors, apps the wallet has used, stablecoin mix, and activity totals. Accepts an EVM (0x…) or Solana address.",
    inputSchema: {
      type: "object",
      properties: {
        address: { type: "string", description: "Wallet address — EVM (0x + 40 hex) or Solana (base58)." },
      },
      required: ["address"],
    },
  },
  {
    name: "check_sanctions",
    description:
      "Compliance shortcut: screen a single wallet address against OFAC sanctions lists. Returns a clear SANCTIONED / clear verdict. Use before transacting with an unknown counterparty.",
    inputSchema: {
      type: "object",
      properties: {
        address: { type: "string", description: "Wallet address to screen — EVM (0x…) or Solana." },
      },
      required: ["address"],
    },
  },
  {
    name: "network_stats",
    description:
      "Get live coverage stats for the rating network: how many smart contracts and transactions are monitored, and the size of the discovered/rated wallet universe.",
    inputSchema: { type: "object", properties: {} },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    if (name === "rate_wallet") {
      const address = String(args?.address ?? "").trim();
      if (!address) throw new Error("Provide a wallet `address`.");
      const json = await apiGet(`/api/v1/score/${encodeURIComponent(address)}`);
      return {
        content: [
          { type: "text", text: summarizeRating(json) },
          { type: "text", text: "```json\n" + JSON.stringify(json.data, null, 2) + "\n```" },
        ],
      };
    }
    if (name === "check_sanctions") {
      const address = String(args?.address ?? "").trim();
      if (!address) throw new Error("Provide a wallet `address`.");
      const json = await apiGet(`/api/v1/score/${encodeURIComponent(address)}`);
      return { content: [{ type: "text", text: summarizeSanctions(json) }] };
    }
    if (name === "network_stats") {
      const json = await apiGet(`/api/v1/stats`);
      return { content: [{ type: "text", text: summarizeStats(json) }] };
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (err) {
    return {
      isError: true,
      content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr only — stdout is the JSON-RPC channel.
  console.error(`visa-wallet-rating MCP server ready → ${BASE_URL}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
