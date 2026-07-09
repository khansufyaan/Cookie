import { appsForFamily } from "./apps";
import { hashSeed } from "./prng";
import type { FactorScore, Grade, ScoreResult, TrustTier, WalletProfile } from "./types";

/**
 * The Wallet Rating Score — the proprietary wallet rating rubric.
 *
 * Five factors, each normalized to 0..1 against network calibration curves,
 * weighted into a 0–1000 score:
 *
 *   C — Consistency (15%)  share of months active since first seen
 *   R — Reach       (20%)  breadth across the chain's tracked top-10 apps
 *   U — Usage       (25%)  transaction count (log-calibrated percentile)
 *   M — Magnitude   (25%)  USD volume moved (log-calibrated percentile)
 *   B — Bedrock     (15%)  wallet tenure + average ticket size
 *
 * Usage and Magnitude are weighted equally and calibrated on log curves, so a
 * "whale" (few transactions, large amounts) and a "power user" (many small
 * transactions) can both reach grade A by different paths.
 *
 * Bonuses (capped at 1000 total):
 *   +50 Full-Stack — active in 5+ of the chain's 10 tracked apps
 *   +50 KYC        — a verified identity attestation on the wallet
 *
 * Trust tiers layered on top of the grade:
 *   Prime      — KYC-verified AND grade A (the top of the network)
 *   Verified   — KYC-verified
 *   Standard   — no attestation
 *   Restricted — on the OFAC sanctions snapshot; grade forced to C-
 *
 * Grades: A >= 800 (~top decile), B >= 450, C < 450, +/- at band edges.
 */

// Calibration ceilings: the value at which a factor saturates to 1.0.
// Derived from public activity distributions of the launch apps (long-tailed,
// hence log calibration). Recalibrated as the indexed population grows.
const CAL = {
  txCountP99: 2500, // transactions across tracked apps
  volumeP99: 5_000_000, // lifetime USD volume
  tenureFullMonths: 48, // 4 years on-chain = full tenure credit
  avgTicketP99: 25_000, // avg USD per transaction
};

const WEIGHTS = {
  consistency: 0.15,
  reach: 0.2,
  usage: 0.25,
  magnitude: 0.25,
  bedrock: 0.15,
} as const;

const FULL_STACK_THRESHOLD = 5; // apps used (of 10) to earn the breadth bonus
const FULL_STACK_BONUS = 50;
const KYC_BONUS = 50;

// Reach saturates at 7 of 10 apps: full breadth credit shouldn't require
// touching literally every tracked protocol.
const REACH_SATURATION = 7;

export interface ScoreSignals {
  kycVerified: boolean;
  kycSource: string;
  sanctioned: boolean;
  sanctionsList: string;
  sanctionsEntryCount: number;
}

function logCalib(value: number, ceiling: number): number {
  if (value <= 0) return 0;
  return Math.min(1, Math.log10(1 + value) / Math.log10(1 + ceiling));
}

export function monthsBetween(fromIso: string, to: Date = new Date()): number {
  const from = new Date(fromIso);
  // Compare in UTC: firstSeen ("YYYY-MM-DD") parses as UTC midnight and the
  // month-end snapshots are built with Date.UTC, so using local getters here
  // would shift a boundary date into the adjacent month in non-UTC timezones.
  return Math.max(
    0,
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth()),
  );
}

export function scoreWallet(
  profile: WalletProfile,
  signals: ScoreSignals,
  opts: { asOf?: Date } = {},
): ScoreResult {
  const trackedApps = appsForFamily(profile.family);
  const active = profile.activities.filter((a) => a.txCount > 0);
  const txCount = active.reduce((s, a) => s + a.txCount, 0);
  const volumeUsd = active.reduce((s, a) => s + a.volumeUsd, 0);
  const appsUsed = active.length;
  const walletAgeMonths = monthsBetween(profile.firstSeen, opts.asOf);
  const avgTicket = txCount > 0 ? volumeUsd / txCount : 0;

  const consistency =
    walletAgeMonths === 0 ? (txCount > 0 ? 1 : 0) : Math.min(1, profile.activeMonths / walletAgeMonths);
  const reach = Math.min(1, appsUsed / REACH_SATURATION);
  const usage = logCalib(txCount, CAL.txCountP99);
  const magnitude = logCalib(volumeUsd, CAL.volumeP99);
  const bedrock =
    0.6 * Math.min(1, walletAgeMonths / CAL.tenureFullMonths) +
    0.4 * logCalib(avgTicket, CAL.avgTicketP99);

  const factors: FactorScore[] = [
    {
      key: "consistency",
      label: "Consistency",
      weight: WEIGHTS.consistency,
      raw: consistency,
      points: Math.round(consistency * WEIGHTS.consistency * 1000),
      detail: `Active ${profile.activeMonths} of ${Math.max(walletAgeMonths, 1)} months on-chain`,
    },
    {
      key: "reach",
      label: "Reach",
      weight: WEIGHTS.reach,
      raw: reach,
      points: Math.round(reach * WEIGHTS.reach * 1000),
      detail: `Used ${appsUsed} of ${trackedApps.length} tracked apps`,
    },
    {
      key: "usage",
      label: "Usage",
      weight: WEIGHTS.usage,
      raw: usage,
      points: Math.round(usage * WEIGHTS.usage * 1000),
      detail: `${txCount.toLocaleString()} transactions across tracked apps`,
    },
    {
      key: "magnitude",
      label: "Magnitude",
      weight: WEIGHTS.magnitude,
      raw: magnitude,
      points: Math.round(magnitude * WEIGHTS.magnitude * 1000),
      detail: `$${Math.round(volumeUsd).toLocaleString()} lifetime volume`,
    },
    {
      key: "bedrock",
      label: "Bedrock",
      weight: WEIGHTS.bedrock,
      raw: bedrock,
      points: Math.round(bedrock * WEIGHTS.bedrock * 1000),
      detail: `${walletAgeMonths} months tenure, $${Math.round(avgTicket).toLocaleString()} avg ticket`,
    },
  ];

  const fullStackBonus = appsUsed >= FULL_STACK_THRESHOLD ? FULL_STACK_BONUS : 0;
  const kycBonus = signals.kycVerified ? KYC_BONUS : 0;
  const score = Math.min(
    1000,
    factors.reduce((s, f) => s + f.points, 0) + fullStackBonus + kycBonus,
  );

  let grade: Grade = score >= 800 ? "A" : score >= 450 ? "B" : "C";
  const bandFloor = grade === "A" ? 800 : grade === "B" ? 450 : 0;
  const bandCeil = grade === "A" ? 1000 : grade === "B" ? 800 : 450;
  const pos = (score - bandFloor) / (bandCeil - bandFloor);
  let modifier: "+" | "" | "-" = pos >= 0.66 ? "+" : pos < 0.2 ? "-" : "";

  let { archetype, archetypeNote } = classifyArchetype({ usage, magnitude, reach, consistency, txCount });

  let tier: TrustTier;
  if (signals.sanctioned) {
    tier = "Restricted";
    grade = "C";
    modifier = "-";
    archetype = "Sanctioned";
    archetypeNote = "Address appears on the OFAC SDN snapshot. Do not serve.";
  } else if (signals.kycVerified && grade === "A") {
    tier = "Prime";
  } else if (signals.kycVerified) {
    tier = "Verified";
  } else {
    tier = "Standard";
  }

  return {
    address: profile.address,
    family: profile.family,
    score: signals.sanctioned ? 0 : score,
    grade,
    modifier,
    tier,
    archetype,
    archetypeNote,
    factors,
    fullStackBonus,
    kycBonus,
    kyc: { verified: signals.kycVerified, source: signals.kycSource },
    sanctions: {
      listed: signals.sanctioned,
      list: signals.sanctionsList,
      checkedAgainst: signals.sanctionsEntryCount,
    },
    totals: { txCount, volumeUsd, appsUsed, walletAgeMonths, activeMonths: profile.activeMonths },
    sbt: {
      minted: txCount > 0 && !signals.sanctioned,
      tokenId: `VWR-${(hashSeed(profile.address.toLowerCase()) % 1_000_000).toString().padStart(6, "0")}`,
      standard: "ERC-5192 (soulbound, non-transferable)",
      note: "Claiming opens soon — the attestation is minted only when the wallet owner opts in.",
    },
  };
}

function classifyArchetype(s: {
  usage: number;
  magnitude: number;
  reach: number;
  consistency: number;
  txCount: number;
}): { archetype: string; archetypeNote: string } {
  if (s.txCount === 0)
    return { archetype: "Ghost", archetypeNote: "No activity in the tracked app set yet." };
  // Blue Chip is the strongest profile (high on every axis) — check it before
  // the Whale/Power-User specializations, which would otherwise shadow it
  // whenever usage and magnitude are close but both high.
  if (s.usage >= 0.55 && s.magnitude >= 0.55 && s.reach >= 0.55)
    return {
      archetype: "Blue Chip",
      archetypeNote: "High activity, high volume, broad across the app set.",
    };
  if (s.magnitude >= 0.55 && s.magnitude - s.usage >= 0.25)
    return {
      archetype: "Whale",
      archetypeNote: "Few transactions, large amounts — rated on Magnitude, not frequency.",
    };
  if (s.usage >= 0.5 && s.usage - s.magnitude >= 0.12)
    return {
      archetype: "Power User",
      archetypeNote: "High transaction frequency at smaller ticket sizes.",
    };
  if (s.reach >= 0.7)
    return { archetype: "Explorer", archetypeNote: "Broad app coverage with moderate depth." };
  if (s.consistency >= 0.6)
    return { archetype: "Regular", archetypeNote: "Steady month-over-month activity." };
  return { archetype: "Tourist", archetypeNote: "Light or sporadic activity so far." };
}
