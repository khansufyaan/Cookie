# Visa Wallet Rating — MCP server

A [Model Context Protocol](https://modelcontextprotocol.io) server that lets any
AI agent — Claude Desktop, Cursor, Claude Code, etc. — **rate a crypto wallet and
screen it for sanctions in plain language**:

> _"Rate wallet 0x2326…cfe8"_ → **A+ · 968/1000 · blue-chip, not sanctioned.**
> _"Is 0x0330…e54a safe to pay?"_ → **⛔ SANCTIONED — do not transact.**

It's a thin relay over the hosted API, so no chain keys, database, or scoring
logic ship with it — the data sources stay server-side.

## Tools

| Tool | What it does |
|------|--------------|
| `rate_wallet` | Full A/B/C/F rating: score, factors, apps used, stablecoin mix, activity totals. |
| `check_sanctions` | One-address OFAC screen — clear vs. SANCTIONED verdict. |
| `network_stats` | Live coverage: monitored contracts/transactions + rated-wallet universe. |

## Install

```bash
cd mcp
npm install
```

## Configure your MCP client

Add this to your client's MCP config (for **Claude Desktop**:
`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS,
`%APPDATA%\Claude\claude_desktop_config.json` on Windows), then restart it:

```json
{
  "mcpServers": {
    "visa-wallet-rating": {
      "command": "node",
      "args": ["/absolute/path/to/Cookie/mcp/server.mjs"],
      "env": {
        "VWR_BASE_URL": "https://visa-wallet-rating.vercel.app",
        "VWR_PASSWORD": "the-site-gate-password"
      }
    }
  }
}
```

For **Claude Code**, from the repo root:

```bash
claude mcp add visa-wallet-rating -e VWR_PASSWORD=the-site-gate-password -- node ./mcp/server.mjs
```

### Environment variables

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `VWR_BASE_URL` | no | `https://visa-wallet-rating.vercel.app` | Point at a preview or local URL to test. |
| `VWR_PASSWORD` | only if gated | — | The site password. The server logs in once and reuses the session cookie. |
| `VWR_API_KEY` | no | — | An `hb_...` key for a higher metered tier. Anonymous access works without one. |

## Try it once from the terminal

The server speaks JSON-RPC over stdio. A quick smoke test that lists the tools:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  VWR_PASSWORD=the-site-gate-password node server.mjs
```

Then, in your MCP client, just ask it to rate a wallet.
