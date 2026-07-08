/**
 * Known custodial / omnibus addresses (registry seed). Deposits sent FROM
 * these addresses carry no wallet-level signal about the end user — the API
 * and UI label them instead of returning a misleading grade. Expanded via
 * partner ingest (custodians mapping sub-accounts) in production.
 */
const CUSTODIAL: Record<string, string> = {
  "0x71660c4005ba85c37ccec55d0c4493e66fe775d3": "Coinbase (hot wallet)",
  "0x503828976d22510aad0201ac7ec88293211d23da": "Coinbase (hot wallet)",
  "0xf977814e90da44bfa03b6295a0616a897441acec": "Binance (hot wallet)",
  "0x28c6c06298d514db089934071355e5743bf21d60": "Binance (hot wallet)",
  "0x2910543af39aba0cd09dbb2d50200b3e800a63d2": "Kraken (hot wallet)",
};

export function custodialLabel(address: string): string | null {
  return CUSTODIAL[address.toLowerCase()] ?? null;
}
