import ofacEth from "./data/ofac-eth.json";
import ofacSol from "./data/ofac-sol.json";

/**
 * OFAC SDN screening against a committed snapshot of sanctioned digital
 * currency addresses (ETH + SOL entries, via the
 * 0xB10C/ofac-sanctioned-digital-currency-addresses extract).
 * Production refreshes this nightly; the snapshot date is the commit date.
 */
const SANCTIONED = new Set([
  ...(ofacEth as string[]).map((a) => a.toLowerCase()),
  ...(ofacSol as string[]), // Solana addresses are case-sensitive base58
]);

export const OFAC_LIST_NAME = "OFAC SDN (digital currency addresses)";
export const OFAC_ENTRY_COUNT = SANCTIONED.size;

export function isOfacSanctioned(address: string): boolean {
  return SANCTIONED.has(address.toLowerCase()) || SANCTIONED.has(address);
}
