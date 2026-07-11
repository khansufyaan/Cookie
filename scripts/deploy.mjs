// Deploys VWRPass to Base Sepolia using RELAYER_PK. Usage:
//   RELAYER_PK=0x… node scripts/deploy.mjs
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { readFileSync } from "node:fs";

const artifact = readFileSync("lib/generated/vwrpass.ts", "utf8");
const abi = JSON.parse(artifact.match(/VWR_PASS_ABI = (\[.*\]) as const;/s)[1]);
const bytecode = artifact.match(/VWR_PASS_BYTECODE = "(0x[0-9a-f]+)"/)[1];

const account = privateKeyToAccount(process.env.RELAYER_PK);
const rpc = process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
const pub = createPublicClient({ chain: baseSepolia, transport: http(rpc) });
const wallet = createWalletClient({ account, chain: baseSepolia, transport: http(rpc) });

const bal = await pub.getBalance({ address: account.address });
console.log("relayer:", account.address, "balance:", Number(bal) / 1e18, "ETH");
if (bal === 0n) { console.error("Fund the relayer first."); process.exit(1); }

const hash = await wallet.deployContract({ abi, bytecode });
console.log("deploy tx:", hash);
const receipt = await pub.waitForTransactionReceipt({ hash, timeout: 120_000 });
console.log("contract:", receipt.contractAddress, "status:", receipt.status);
