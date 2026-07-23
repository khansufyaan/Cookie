/**
 * US-exchange exposure registry + verdict logic.
 *
 * Purpose: given a wallet, decide how likely its owner is a US person by
 * looking for on-chain interactions with US-regulated centralized exchanges.
 * This is the signal a CLARITY-style geoblocking regime would use.
 *
 * IMPORTANT nuance the tool must surface honestly:
 *   - A withdrawal from a labeled exchange hot wallet is the STRONGEST signal
 *     (the exchange KYC'd the recipient and sent funds straight to them).
 *   - Coinbase / Kraken / Gemini are US-regulated but also serve non-US users,
 *     so their signal proves "KYC'd at a US venue", not "US resident".
 *   - Binance.US and Robinhood Crypto are US-resident-only, so their signal is
 *     close to definitive for US residency.
 *   - Absence of signal is NOT proof of non-US (privacy tooling, fresh wallet,
 *     DEX-only history).
 *
 * The registry is a SEED of the most widely-published hot-wallet addresses.
 * In production it must be backed by a maintained labeled-address feed
 * (Etherscan public tags / Arkham / Chainalysis), which the console can ingest.
 */

export type Tier = "us-only" | "us-regulated";

export interface CexEntity {
  name: string;
  tier: Tier;
  addresses: string[]; // lowercase
}

export const US_CEX: CexEntity[] = [
  {
    name: "Coinbase",
    tier: "us-regulated",
    addresses: [
      "0x71660c4005ba85c37ccec55d0c4493e66fe775d3",
      "0x503828976d22510aad0201ac7ec88293211d23da",
      "0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740",
      "0x3cd751e6b0078be393132286c442345e5dc49699",
      "0xb5d85cbf7cb3ee0d56b3bb207d5fc4b82f43f511",
      "0xeb2629a2734e272bcc07bda959863f316f4bd4cf",
      "0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43",
    ],
  },
  {
    name: "Kraken",
    tier: "us-regulated",
    addresses: [
      "0x2910543af39aba0cd09dbb2d50200b3e800a63d2",
      "0x0a869d79a7052c7f1b55a8ebabbea3420f0d1e13",
      "0xe853c56864a2ebe4576a807d26fdc4a0ada51919",
      "0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0",
      "0xfa52274dd61e1643d2205169732f29114bc240b3",
    ],
  },
  {
    name: "Gemini",
    tier: "us-regulated",
    addresses: [
      "0xd24400ae8bfebb18ca49be86258a3c749cf46853",
      "0x6fc82a5fe25a5cdb58bc74600a40a69c065263f8",
      "0x5f65f7b609678448494de4c87521cdf6cef1e932",
      "0x61edcdf5bb737adffe5043706e7c5bb1f1a56eea",
    ],
  },
  {
    // US-resident-only venue — near-definitive US residency when present.
    name: "Binance.US",
    tier: "us-only",
    addresses: ["0x34ea4138580435b5a521e460035edb19df1938c1"],
  },
];

const ADDR_INDEX: Map<string, CexEntity> = (() => {
  const m = new Map<string, CexEntity>();
  for (const e of US_CEX) for (const a of e.addresses) m.set(a.toLowerCase(), e);
  return m;
})();

export function lookupCex(address: string): CexEntity | null {
  return ADDR_INDEX.get(address.toLowerCase()) ?? null;
}

// ---- Verdict model ----

export type EvidenceKind = "withdrawal" | "deposit" | "attestation";

export interface Evidence {
  kind: EvidenceKind;
  entity: string;
  tier: Tier;
  weight: number; // P that THIS evidence implies a US person
  detail: string;
  txHash?: string;
  date?: string;
}

/** Confidence for a single signal, by direction and venue tier. */
export function weightFor(kind: EvidenceKind, tier: Tier): number {
  if (kind === "attestation") return 0.7; // Coinbase Verifications = US-KYC proof
  if (kind === "withdrawal") return tier === "us-only" ? 0.96 : 0.78;
  // deposit (direct to a labeled hot wallet)
  return tier === "us-only" ? 0.9 : 0.62;
}

export type Verdict = "likely-us" | "possible-us" | "us-regulated-only" | "no-signal";

export interface UsAssessment {
  probability: number; // 0..1, noisy-OR over evidence
  verdict: Verdict;
  hasUsOnly: boolean;
  evidence: Evidence[];
}

const VERDICT_LABEL: Record<Verdict, { label: string; blurb: string }> = {
  "likely-us": {
    label: "Likely US person",
    blurb: "Strong on-chain ties to a US-regulated exchange — geoblock candidate.",
  },
  "possible-us": {
    label: "Possibly US",
    blurb: "Some US-exchange exposure. Recommend step-up verification before serving.",
  },
  "us-regulated-only": {
    label: "US-regulated exposure",
    blurb: "KYC'd at a US venue that also serves non-US users — not proof of US residency.",
  },
  "no-signal": {
    label: "No US signal found",
    blurb: "No interactions with tracked US exchanges. Absence is not proof of non-US.",
  },
};

export function assess(evidence: Evidence[]): UsAssessment {
  // Noisy-OR combine (independent signals).
  const probability = evidence.length
    ? 1 - evidence.reduce((p, e) => p * (1 - e.weight), 1)
    : 0;
  const hasUsOnly = evidence.some((e) => e.tier === "us-only");
  const hasWithdrawal = evidence.some((e) => e.kind === "withdrawal");

  let verdict: Verdict;
  if (evidence.length === 0) verdict = "no-signal";
  else if (hasUsOnly || (probability >= 0.85 && hasWithdrawal)) verdict = "likely-us";
  else if (probability >= 0.6) verdict = "possible-us";
  else verdict = "us-regulated-only";

  return { probability, verdict, hasUsOnly, evidence };
}

export function verdictMeta(v: Verdict) {
  return VERDICT_LABEL[v];
}
