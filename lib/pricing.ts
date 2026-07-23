/** Pricing tiers — shared by /pricing and the pricing recap on /developers. */
export interface Tier {
  name: string;
  price: string;
  period: string;
  blurb: string;
  features: string[];
  highlight: boolean;
}

export const TIERS: Tier[] = [
  {
    name: "Data Partner",
    price: "$0",
    period: "",
    blurb: "Report off-chain data on your users' wallets — read free.",
    features: [
      "Report outcomes, fraud flags, KYC via ingest",
      "Unlimited verifications while you report",
      "Full rating + factor breakdown",
      "Grade-change webhooks",
    ],
    highlight: false,
  },
  {
    name: "Commercial",
    price: "$0.002",
    period: "/ verification",
    blurb: "Read-only. Priced from the first call.",
    features: [
      "Volume tiers, $2,500 / mo minimum",
      "25,000+ verifications / day",
      "Deposit + transfer-time screening",
      "Grade-change webhooks",
      "Score history + OFAC/KYC flags",
    ],
    highlight: true,
  },
  {
    name: "Strategic",
    price: "Custom",
    period: "",
    blurb: "Issuers, exchanges, and networks.",
    features: [
      "Committed volume + SLA",
      "Bulk universe export",
      "Custom factor weighting",
      "Co-branded rating programs",
      "MSA + DPA",
    ],
    highlight: false,
  },
];
