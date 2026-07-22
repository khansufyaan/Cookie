/**
 * RPC provider registry, tagged by jurisdiction.
 *
 * IMPORTANT framing: RPC choice is NOT recorded on-chain, so this is not a
 * per-wallet classifier — it can't tell you whether a given address is US.
 * Its purpose is the OTHER CLARITY vector: a US-domiciled RPC provider would
 * be compelled to geoblock US IPs at connection time (an IP-layer control the
 * provider enforces). This list tells you:
 *   - which providers are US-domiciled (expected to geoblock US traffic),
 *   - which are non-US (expected to remain open to US IPs),
 *   - and which wallet DEFAULT to which — the endpoints most users actually
 *     hit, and where a US geoblock would bite first.
 *
 * Jurisdictions are curated from public company records and should be legally
 * verified before use in a compliance control. `confidence` flags how settled
 * each classification is.
 */

export type Jurisdiction = "us" | "non-us" | "decentralized";
export type Confidence = "established" | "verify";

export interface RpcProvider {
  name: string;
  jurisdiction: Jurisdiction;
  hq: string;
  role: string; // what it is
  confidence: Confidence;
  note?: string;
}

export const RPC_PROVIDERS: RpcProvider[] = [
  // ---- US-domiciled gateways (would geoblock US IPs under a US mandate) ----
  { name: "Infura", jurisdiction: "us", hq: "USA — Brooklyn, NY (Consensys)", role: "Hosted RPC gateway", confidence: "established", note: "MetaMask's default RPC — the single most-used endpoint in the ecosystem." },
  { name: "Alchemy", jurisdiction: "us", hq: "USA — San Francisco, CA", role: "Hosted RPC gateway", confidence: "established", note: "Powers many wallets/apps as their backend RPC." },
  { name: "QuickNode", jurisdiction: "us", hq: "USA — Miami, FL", role: "Hosted RPC gateway", confidence: "established" },
  { name: "Coinbase Developer Platform", jurisdiction: "us", hq: "USA — Coinbase", role: "Hosted RPC / Base default", confidence: "established", note: "Default RPC for Coinbase Wallet and Base." },
  { name: "Blockdaemon", jurisdiction: "us", hq: "USA — New York, NY", role: "Node infrastructure", confidence: "established" },
  { name: "Grove (Pocket Network gateway)", jurisdiction: "us", hq: "USA — Grove Inc", role: "Gateway over a decentralized net", confidence: "established", note: "Grove the company is US; the underlying Pocket protocol is decentralized." },
  { name: "Tenderly", jurisdiction: "us", hq: "USA — San Francisco, CA", role: "RPC + dev platform", confidence: "established" },
  { name: "Helius", jurisdiction: "us", hq: "USA", role: "Solana RPC gateway", confidence: "established", note: "Widely used Solana backend." },
  { name: "Triton One", jurisdiction: "us", hq: "USA", role: "Solana RPC", confidence: "verify" },

  // ---- Non-US gateways (expected to remain open to US IPs) ----
  { name: "PublicNode (Allnodes)", jurisdiction: "non-us", hq: "UAE / Estonia (Allnodes)", role: "Free public RPC", confidence: "verify" },
  { name: "NodeReal", jurisdiction: "non-us", hq: "Singapore", role: "Hosted RPC gateway", confidence: "established" },
  { name: "GetBlock", jurisdiction: "non-us", hq: "UAE / Cyprus", role: "Hosted RPC gateway", confidence: "verify" },
  { name: "OnFinality", jurisdiction: "non-us", hq: "Australia / Singapore", role: "Node infrastructure", confidence: "verify" },
  { name: "Chainstack", jurisdiction: "non-us", hq: "Singapore", role: "Hosted RPC gateway", confidence: "established" },
  { name: "1RPC (Automata)", jurisdiction: "non-us", hq: "Privacy relay", role: "Metadata-shielding RPC", confidence: "verify", note: "Strips client metadata — designed to resist exactly this kind of IP fingerprinting." },

  // ---- Decentralized / no single jurisdiction to compel ----
  { name: "Pocket Network", jurisdiction: "decentralized", hq: "Permissionless node network", role: "Decentralized RPC protocol", confidence: "established", note: "No single operator to serve a geoblock order — though gateways in front of it (e.g. Grove) may be US." },
  { name: "Lava Network", jurisdiction: "decentralized", hq: "Permissionless provider net", role: "Decentralized RPC protocol", confidence: "established" },
  { name: "dRPC", jurisdiction: "decentralized", hq: "Distributed provider net", role: "Decentralized RPC marketplace", confidence: "verify" },
  { name: "Ankr", jurisdiction: "decentralized", hq: "Global / decentralized", role: "Hybrid RPC network", confidence: "verify" },
];

export interface WalletDefault {
  wallet: string;
  defaultRpc: string;
  jurisdiction: Jurisdiction;
}

/** Where the wallets people actually use point by default — the endpoints a
 *  US geoblock would hit first. Most defaults are US-domiciled. */
export const WALLET_DEFAULTS: WalletDefault[] = [
  { wallet: "MetaMask", defaultRpc: "Infura", jurisdiction: "us" },
  { wallet: "Coinbase Wallet", defaultRpc: "Coinbase Developer Platform", jurisdiction: "us" },
  { wallet: "Rabby", defaultRpc: "Rotates hosted providers (mostly US)", jurisdiction: "us" },
  { wallet: "Phantom (Solana)", defaultRpc: "US-hosted Solana infra", jurisdiction: "us" },
  { wallet: "Rainbow", defaultRpc: "Alchemy", jurisdiction: "us" },
  { wallet: "Frame / self-hosted node", defaultRpc: "User's own node", jurisdiction: "decentralized" },
];

export const JURISDICTION_META: Record<Jurisdiction, { label: string; color: string; blurb: string }> = {
  us: { label: "US-domiciled", color: "var(--risk-high)", blurb: "Expected to geoblock US IPs under a US mandate." },
  "non-us": { label: "Non-US", color: "var(--risk-low)", blurb: "Outside direct US jurisdiction — expected to stay open to US IPs." },
  decentralized: { label: "Decentralized", color: "var(--risk-elevated)", blurb: "No single operator to compel — geoblock is far harder to enforce." },
};
