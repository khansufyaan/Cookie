import type { AppInfo } from "./types";

/**
 * The launch app set: top-10 apps by volume on each chain family
 * (curated mid-2026; recalibrated quarterly). Contracts/programs are the
 * real primary mainnet entry points — wallets that interact with these
 * form the rating universe.
 */
export const EVM_APPS: AppInfo[] = [
  {
    id: "uniswap", name: "Uniswap", category: "DEX",
    contract: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD", // Universal Router
    altContracts: [
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // V2 Router02
      "0xE592427A0AEce92De3Edee1F18E0157C05861564", // V3 SwapRouter
      "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // SwapRouter02
    ],
    chain: "Ethereum", family: "evm",
  },
  { id: "aave", name: "Aave", category: "Lending", contract: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", chain: "Ethereum", family: "evm" }, // V3 Pool
  {
    id: "lido", name: "Lido", category: "Liquid Staking",
    contract: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", // stETH
    altContracts: ["0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"], // wstETH
    chain: "Ethereum", family: "evm",
  },
  { id: "morpho", name: "Morpho", category: "Lending", contract: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb", chain: "Ethereum", family: "evm" }, // Morpho Blue
  { id: "curve", name: "Curve", category: "Stableswap DEX", contract: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7", chain: "Ethereum", family: "evm" }, // 3pool
  {
    id: "1inch", name: "1inch", category: "DEX Aggregator",
    contract: "0x1111111254EEB25477B68fb85Ed929f73A960582", // AggregationRouterV5
    altContracts: ["0x111111125421cA6dc452d289314280a0f8842A65"], // AggregationRouterV6
    chain: "Ethereum", family: "evm",
  },
  { id: "polymarket", name: "Polymarket", category: "Prediction Market", contract: "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E", chain: "Polygon", family: "evm" }, // CTF Exchange
  { id: "ethena", name: "Ethena", category: "Synthetic Dollar", contract: "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3", chain: "Ethereum", family: "evm" }, // USDe
  { id: "eigenlayer", name: "EigenLayer", category: "Restaking", contract: "0x858646372CC42E1A627fcE94aa7A7033e7CF075A", chain: "Ethereum", family: "evm" }, // StrategyManager
  { id: "pendle", name: "Pendle", category: "Yield Trading", contract: "0x888888888889758F76e7103c6CbF23ABbF58F946", chain: "Ethereum", family: "evm" }, // Router V4
];

export const SOL_APPS: AppInfo[] = [
  { id: "jupiter", name: "Jupiter", category: "DEX Aggregator", contract: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", chain: "Solana", family: "solana" }, // v6
  { id: "raydium", name: "Raydium", category: "DEX", contract: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", chain: "Solana", family: "solana" }, // AMM V4
  { id: "orca", name: "Orca", category: "DEX", contract: "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc", chain: "Solana", family: "solana" }, // Whirlpools
  { id: "pumpfun", name: "Pump.fun", category: "Token Launchpad", contract: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P", chain: "Solana", family: "solana" },
  { id: "pumpswap", name: "PumpSwap", category: "Memecoin AMM", contract: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA", chain: "Solana", family: "solana" },
  { id: "meteora", name: "Meteora", category: "Liquidity", contract: "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo", chain: "Solana", family: "solana" }, // DLMM
  { id: "kamino", name: "Kamino", category: "Lending", contract: "KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD", chain: "Solana", family: "solana" },
  { id: "drift", name: "Drift", category: "Perps", contract: "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH", chain: "Solana", family: "solana" }, // v2
  { id: "jito", name: "Jito", category: "Liquid Staking", contract: "Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb", chain: "Solana", family: "solana" },
  { id: "marinade", name: "Marinade", category: "Liquid Staking", contract: "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD", chain: "Solana", family: "solana" },
];

export const ALL_APPS: AppInfo[] = [...EVM_APPS, ...SOL_APPS];
export const APP_BY_ID = new Map(ALL_APPS.map((a) => [a.id, a]));

export type ChainFamily = "evm" | "solana";

export function appsForFamily(family: ChainFamily): AppInfo[] {
  return family === "evm" ? EVM_APPS : SOL_APPS;
}

/** Contract address (lowercased for EVM) -> app, for live-chain matching.
 * Includes secondary entry points (older routers, wrapped variants). */
export const EVM_APP_BY_CONTRACT = new Map(
  EVM_APPS.flatMap((a) =>
    [a.contract, ...(a.altContracts ?? [])].map((c) => [c.toLowerCase(), a] as const),
  ),
);
