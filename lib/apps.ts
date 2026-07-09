import type { AppInfo } from "./types";

/**
 * The launch app set: top-10 apps by volume on each chain family
 * (curated mid-2026; recalibrated quarterly). Contracts/programs are the
 * real primary mainnet entry points — wallets that interact with these
 * form the rating universe. Every address is verified against the chain
 * explorer before inclusion.
 */
export const EVM_APPS: AppInfo[] = [
  {
    id: "uniswap", domain: "uniswap.org", name: "Uniswap", category: "DEX",
    contract: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD", // Universal Router (v3-era)
    altContracts: [
      "0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af", // Universal Router (v4-era)
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // V2 Router02
      "0xE592427A0AEce92De3Edee1F18E0157C05861564", // V3 SwapRouter
      "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // SwapRouter02
      "0xC36442b4a4522E871399CD717aBDD847Ab11FE88", // V3 NonfungiblePositionManager (LPs)
      "0x000000000004444c5dc75cB358380D2e3dE08A90", // V4 PoolManager
    ],
    chain: "Ethereum", family: "evm",
  },
  {
    id: "aave", domain: "aave.com", name: "Aave", category: "Lending",
    contract: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", // V3 Pool
    altContracts: ["0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9"], // V2 LendingPool
    chain: "Ethereum", family: "evm",
  },
  {
    id: "lido", domain: "lido.fi", name: "Lido", category: "Liquid Staking",
    contract: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", // stETH (stake)
    altContracts: [
      "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0", // wstETH (wrap)
      "0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1", // Withdrawal Queue (unstETH)
    ],
    chain: "Ethereum", family: "evm",
  },
  {
    id: "morpho", domain: "morpho.org", name: "Morpho", category: "Lending",
    contract: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb", // Morpho Blue
    altContracts: [
      "0x6566194141eefa99Af43Bb5Aa71460Ca2Dc90245", // Bundler3
      "0x777777c9898D384F785Ee44Acfe945efDFf5f3E0", // Morpho-AaveV2 Optimizer (legacy)
    ],
    chain: "Ethereum", family: "evm",
  },
  {
    id: "curve", domain: "curve.finance", name: "Curve", category: "Stableswap DEX",
    contract: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7", // 3pool
    altContracts: ["0x99a58482BD75cbab83b27EC03CA68fF489b5788f"], // Router (registry exchange)
    chain: "Ethereum", family: "evm",
  },
  {
    id: "1inch", domain: "1inch.io", name: "1inch", category: "DEX Aggregator",
    contract: "0x1111111254EEB25477B68fb85Ed929f73A960582", // AggregationRouterV5
    altContracts: [
      "0x111111125421cA6dc452d289314280a0f8842A65", // AggregationRouterV6
      "0x1111111254fb6c44bAC0beD2854e76F90643097d", // AggregationRouterV4
      "0x11111112542D85B3EF69AE05771c2dCCff4fAa26", // AggregationRouterV3
    ],
    chain: "Ethereum", family: "evm",
  },
  { id: "polymarket", domain: "polymarket.com", name: "Polymarket", category: "Prediction Market", contract: "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E", chain: "Polygon", family: "evm" }, // CTF Exchange
  {
    id: "ethena", domain: "ethena.fi", name: "Ethena", category: "Synthetic Dollar",
    contract: "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3", // USDe
    altContracts: ["0x9D39A5DE30e57443BfF2A8307A4256c8797A3497"], // sUSDe (staking)
    chain: "Ethereum", family: "evm",
  },
  {
    id: "eigenlayer", domain: "eigenlayer.xyz", name: "EigenLayer", category: "Restaking",
    contract: "0x858646372CC42E1A627fcE94aa7A7033e7CF075A", // StrategyManager
    altContracts: [
      "0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A", // DelegationManager
      "0x91E677b07F7AF907ec9a428aafA9fc14a0d3A338", // EigenPodManager
    ],
    chain: "Ethereum", family: "evm",
  },
  {
    id: "pendle", domain: "pendle.finance", name: "Pendle", category: "Yield Trading",
    contract: "0x888888888889758F76e7103c6CbF23ABbF58F946", // Router V4
    altContracts: ["0x00000000005BBB0EF59571E58418F9a4357b68A0"], // Router V3
    chain: "Ethereum", family: "evm",
  },
];

export const SOL_APPS: AppInfo[] = [
  { id: "jupiter", domain: "jup.ag", name: "Jupiter", category: "DEX Aggregator", contract: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", chain: "Solana", family: "solana" }, // v6
  { id: "raydium", domain: "raydium.io", name: "Raydium", category: "DEX", contract: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", chain: "Solana", family: "solana" }, // AMM V4
  { id: "orca", domain: "orca.so", name: "Orca", category: "DEX", contract: "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc", chain: "Solana", family: "solana" }, // Whirlpools
  { id: "pumpfun", domain: "pump.fun", name: "Pump.fun", category: "Token Launchpad", contract: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P", chain: "Solana", family: "solana" },
  { id: "pumpswap", domain: "swap.pump.fun", name: "PumpSwap", category: "Memecoin AMM", contract: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA", chain: "Solana", family: "solana" },
  { id: "meteora", domain: "meteora.ag", name: "Meteora", category: "Liquidity", contract: "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo", chain: "Solana", family: "solana" }, // DLMM
  { id: "kamino", domain: "kamino.finance", name: "Kamino", category: "Lending", contract: "KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD", chain: "Solana", family: "solana" },
  { id: "drift", domain: "drift.trade", name: "Drift", category: "Perps", contract: "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH", chain: "Solana", family: "solana" }, // v2
  { id: "jito", domain: "jito.network", name: "Jito", category: "Liquid Staking", contract: "Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb", chain: "Solana", family: "solana" },
  { id: "marinade", domain: "marinade.finance", name: "Marinade", category: "Liquid Staking", contract: "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD", chain: "Solana", family: "solana" },
];

export const ALL_APPS: AppInfo[] = [...EVM_APPS, ...SOL_APPS];
export const APP_BY_ID = new Map(ALL_APPS.map((a) => [a.id, a]));

/** Human labels for every monitored contract/program (keyed lowercase). */
export const CONTRACT_LABELS: Record<string, string> = {
  // Uniswap
  "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad": "Universal Router",
  "0x66a9893cc07d91d95644aedd05d03f95e1dba8af": "Universal Router (v4)",
  "0x7a250d5630b4cf539739df2c5dacb4c659f2488d": "V2 Router02",
  "0xe592427a0aece92de3edee1f18e0157c05861564": "V3 SwapRouter",
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45": "SwapRouter02",
  "0xc36442b4a4522e871399cd717abdd847ab11fe88": "V3 Positions NFT (liquidity)",
  "0x000000000004444c5dc75cb358380d2e3de08a90": "V4 PoolManager",
  // Aave
  "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2": "V3 Pool",
  "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9": "V2 LendingPool",
  // Lido
  "0xae7ab96520de3a18e5e111b5eaab095312d7fe84": "stETH (stake)",
  "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0": "wstETH (wrap)",
  "0x889edc2edab5f40e902b864ad4d7ade8e412f9b1": "Withdrawal Queue (unstETH)",
  // Morpho
  "0xbbbbbbbbbb9cc5e90e3b3af64bdaf62c37eeffcb": "Morpho Blue",
  "0x6566194141eefa99af43bb5aa71460ca2dc90245": "Bundler3",
  "0x777777c9898d384f785ee44acfe945efdff5f3e0": "Morpho-AaveV2 Optimizer (legacy)",
  // Curve
  "0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7": "3pool",
  "0x99a58482bd75cbab83b27ec03ca68ff489b5788f": "Router (registry exchange)",
  // 1inch
  "0x1111111254eeb25477b68fb85ed929f73a960582": "AggregationRouter V5",
  "0x111111125421ca6dc452d289314280a0f8842a65": "AggregationRouter V6",
  "0x1111111254fb6c44bac0bed2854e76f90643097d": "AggregationRouter V4",
  "0x11111112542d85b3ef69ae05771c2dccff4faa26": "AggregationRouter V3",
  // Polymarket
  "0x4bfb41d5b3570defd03c39a9a4d8de6bd8b8982e": "CTF Exchange (Polygon)",
  // Ethena
  "0x4c9edd5852cd905f086c759e8383e09bff1e68b3": "USDe",
  "0x9d39a5de30e57443bff2a8307a4256c8797a3497": "sUSDe (staking)",
  // EigenLayer
  "0x858646372cc42e1a627fce94aa7a7033e7cf075a": "StrategyManager",
  "0x39053d51b77dc0d36036fc1fcc8cb819df8ef37a": "DelegationManager",
  "0x91e677b07f7af907ec9a428aafa9fc14a0d3a338": "EigenPodManager",
  // Pendle
  "0x888888888889758f76e7103c6cbf23abbf58f946": "Router V4",
  "0x00000000005bbb0ef59571e58418f9a4357b68a0": "Router V3",
  // Solana programs
  "jup6lkbzbjs1jkkwapdhny74zcz3tluzoi5qnyvtav4": "Aggregator v6",
  "675kpx9mhtjs2zt1qfr1nyhuzelxfqm9h24wfsut1mp8": "AMM V4",
  "whirlbmiicvdio4qvufm5kag6ct8vwpyzgff3uctycc": "Whirlpools",
  "6ef8rrecthr5dkzon8nwu78hrvfckubj14m5ubewf6p": "Bonding Curve",
  "pammbay6oceh9fjkbrhgp5d4bd4swpmswmn52fmfxea": "AMM",
  "lbuzkhrxpf3xupbcjp4yztkglccjzhtsdm9yuvapwxo": "DLMM",
  "klend2g3cp87fffoy8q1mqqgkjrxjc8bosyayavgmjd": "Kamino Lend",
  "driftyha39mwei3m9aunc5mzrf1jyubsbn6vpcn33uh": "Drift v2",
  "jito4apyf642jpzpx3hgc6wwj8zpktrbrs4p815awbb": "Stake Pool",
  "marbmssgkxdrn1egzf5sqe1tmai9k1rchyndjgjq7ad": "Liquid Staking",
};

/** All monitored contracts for an app, labeled, primary first. */
export function contractsForApp(app: AppInfo): { address: string; label: string }[] {
  return [app.contract, ...(app.altContracts ?? [])].map((c) => ({
    address: c,
    label: CONTRACT_LABELS[c.toLowerCase()] ?? "Entry point",
  }));
}

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
