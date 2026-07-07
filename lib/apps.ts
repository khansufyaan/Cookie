import type { AppInfo } from "./types";

/**
 * The five launch apps Cookie indexes to bootstrap the rating network.
 * Contracts are the real primary mainnet entry points for each protocol —
 * wallets that have interacted with these are the initial rating universe.
 */
export const TOP_APPS: AppInfo[] = [
  {
    id: "uniswap",
    name: "Uniswap",
    category: "DEX / Swaps",
    contract: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD", // Universal Router
    chain: "Ethereum",
  },
  {
    id: "opensea",
    name: "OpenSea",
    category: "NFT Marketplace",
    contract: "0x0000000000000068F116a894984e2DB1123eB395", // Seaport 1.6
    chain: "Ethereum",
  },
  {
    id: "aave",
    name: "Aave",
    category: "Lending",
    contract: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", // Aave V3 Pool
    chain: "Ethereum",
  },
  {
    id: "lido",
    name: "Lido",
    category: "Liquid Staking",
    contract: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", // stETH
    chain: "Ethereum",
  },
  {
    id: "blur",
    name: "Blur",
    category: "Pro NFT Trading",
    contract: "0x000000000000Ad05Ccc4F10045630fb830B95127", // Blur Marketplace
    chain: "Ethereum",
  },
];

export const APP_BY_ID = new Map(TOP_APPS.map((a) => [a.id, a]));
