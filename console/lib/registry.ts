/** Built-in monitored coverage — the public app set the rating engine tracks
 *  (primary entry-point contracts; secondary routers are matched in lookups). */

export interface MonitoredContract {
  label: string;
  chain: string;
  address: string;
  kind: "public-app" | "visa-internal" | "hsm-wallet";
  category: string;
  status: "live" | "pending";
}

export const BUILTIN_CONTRACTS: MonitoredContract[] = [
  { label: "Uniswap — Universal Router", chain: "Ethereum", address: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD", kind: "public-app", category: "DEX", status: "live" },
  { label: "Aave — V3 Pool", chain: "Ethereum", address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", kind: "public-app", category: "Lending", status: "live" },
  { label: "Lido — stETH", chain: "Ethereum", address: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", kind: "public-app", category: "Liquid Staking", status: "live" },
  { label: "Morpho — Morpho Blue", chain: "Ethereum", address: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb", kind: "public-app", category: "Lending", status: "live" },
  { label: "Curve — 3pool", chain: "Ethereum", address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7", kind: "public-app", category: "Stableswap DEX", status: "live" },
  { label: "1inch — AggregationRouterV5", chain: "Ethereum", address: "0x1111111254EEB25477B68fb85Ed929f73A960582", kind: "public-app", category: "DEX Aggregator", status: "live" },
  { label: "Polymarket — CTF Exchange", chain: "Polygon", address: "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E", kind: "public-app", category: "Prediction Market", status: "pending" },
  { label: "Ethena — USDe", chain: "Ethereum", address: "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3", kind: "public-app", category: "Synthetic Dollar", status: "live" },
  { label: "EigenLayer — StrategyManager", chain: "Ethereum", address: "0x858646372CC42E1A627fcE94aa7A7033e7CF075A", kind: "public-app", category: "Restaking", status: "live" },
  { label: "Pendle — Router V4", chain: "Ethereum", address: "0x888888888889758F76e7103c6CbF23ABbF58F946", kind: "public-app", category: "Yield Trading", status: "live" },
  { label: "Jupiter — v6", chain: "Solana", address: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", kind: "public-app", category: "DEX Aggregator", status: "live" },
  { label: "Raydium — AMM V4", chain: "Solana", address: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", kind: "public-app", category: "DEX", status: "live" },
  { label: "Orca — Whirlpools", chain: "Solana", address: "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc", kind: "public-app", category: "DEX", status: "live" },
  { label: "Pump.fun", chain: "Solana", address: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P", kind: "public-app", category: "Token Launchpad", status: "live" },
  { label: "PumpSwap", chain: "Solana", address: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA", kind: "public-app", category: "Memecoin AMM", status: "live" },
  { label: "Meteora — DLMM", chain: "Solana", address: "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo", kind: "public-app", category: "Liquidity", status: "live" },
  { label: "Kamino — KLend", chain: "Solana", address: "KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD", kind: "public-app", category: "Lending", status: "live" },
  { label: "Drift — v2", chain: "Solana", address: "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH", kind: "public-app", category: "Perps", status: "live" },
  { label: "Jito", chain: "Solana", address: "Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb", kind: "public-app", category: "Liquid Staking", status: "live" },
  { label: "Marinade", chain: "Solana", address: "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD", kind: "public-app", category: "Liquid Staking", status: "live" },
];

export const KIND_META: Record<MonitoredContract["kind"], { label: string; hint: string }> = {
  "public-app": { label: "Public app", hint: "Third-party protocol contract tracked by the rating engine." },
  "visa-internal": { label: "Visa internal", hint: "A Visa-operated contract or app endpoint (e.g. settlement, on-ramp)." },
  "hsm-wallet": { label: "HSM wallet", hint: "A Visa HSM-custodied wallet that customers transact with." },
};
