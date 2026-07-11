import { createPublicClient, createWalletClient, http, parseEventLogs } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { VWR_PASS_ABI } from "./generated/vwrpass";

/**
 * On-chain pass minting (Base Sepolia for the demo; swap chain + env for
 * mainnet). The relayer wallet owns the contract and pays gas — "gas on us".
 * Active only when RELAYER_PRIVATE_KEY + PASS_CONTRACT_ADDRESS are set;
 * without them the claim flow falls back to reservation-only.
 */

const RPC = process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";

export const PASS_CHAIN = {
  name: "Base Sepolia",
  explorer: "https://sepolia.basescan.org",
} as const;

export function passChainConfigured(): boolean {
  return Boolean(process.env.RELAYER_PRIVATE_KEY && process.env.PASS_CONTRACT_ADDRESS);
}

export interface MintResult {
  contract: string;
  tokenId: string;
  txHash: string | null; // null when the pass already existed
  explorerTx: string | null;
  alreadyMinted: boolean;
}

export async function mintPassOnChain(to: `0x${string}`, grade: string, score: number): Promise<MintResult> {
  const contract = process.env.PASS_CONTRACT_ADDRESS as `0x${string}`;
  const account = privateKeyToAccount(process.env.RELAYER_PRIVATE_KEY as `0x${string}`);
  const pub = createPublicClient({ chain: baseSepolia, transport: http(RPC) });
  const wallet = createWalletClient({ account, chain: baseSepolia, transport: http(RPC) });

  const existing = (await pub.readContract({
    address: contract,
    abi: VWR_PASS_ABI,
    functionName: "tokenOf",
    args: [to],
  })) as bigint;
  if (existing !== BigInt(0)) {
    return {
      contract,
      tokenId: existing.toString(),
      txHash: null,
      explorerTx: null,
      alreadyMinted: true,
    };
  }

  const txHash = await wallet.writeContract({
    address: contract,
    abi: VWR_PASS_ABI,
    functionName: "mint",
    args: [to, grade, score],
  });
  const receipt = await pub.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 });
  if (receipt.status !== "success") throw new Error("mint transaction reverted");

  const transfers = parseEventLogs({ abi: VWR_PASS_ABI, logs: receipt.logs, eventName: "Transfer" });
  const tokenId = (transfers[0]?.args as { tokenId?: bigint } | undefined)?.tokenId?.toString() ?? "";

  return {
    contract,
    tokenId,
    txHash,
    explorerTx: `${PASS_CHAIN.explorer}/tx/${txHash}`,
    alreadyMinted: false,
  };
}
