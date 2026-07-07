import { TOP_APPS } from "./apps";
import { hashSeed } from "./prng";
import type { FactorScore, Grade, ScoreResult, WalletProfile } from "./types";

/**
 * The CRUMB Score — Cookie's proprietary wallet rating rubric.
 *
 * Five factors, each normalized to 0..1 against network calibration curves,
 * weighted into a 0–1000 score:
 *
 *   C — Consistency (15%)  share of months active since first seen
 *   R — Reach       (20%)  breadth across the tracked app set
 *   U — Usage       (25%)  transaction count (log-calibrated percentile)
 *   M — Magnitude   (25%)  USD volume moved (log-calibrated percentile)
 *   B — Bona fides  (15%)  wallet tenure + average ticket size
 *
 * Usage and Magnitude are weighted equally and calibrated on log curves, so a
 * "whale" (few transactions, large amounts) and a "power user" (many small
 * transactions) can both reach grade A by different paths. Reach captures the
 * cross-app requirement: a wallet active in all five launch apps earns a
 * Full-Stack bonus on top of a maxed Reach factor.
 *
 * Grades: A >= 800, B >= 450, C < 450, with +/- modifiers at band edges.
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
  bonaFides: 0.15,
} as const;

const FULL_STACK_BONUS = 50; // flat bonus for activity in every tracked app

function logCalib(value: number, ceiling: number): number {
  if (value <= 0) return 0;
  return Math.min(1, Math.log10(1 + value) / Math.log10(1 + ceiling));
}

export function monthsBetween(fromIso: string, to: Date = new Date()): number {
  const from = new Date(fromIso);
  return Math.max(
    0,
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()),
  );
}

export function scoreWallet(profile: WalletProfile): ScoreResult {
  const active = profile.activities.filter((a) => a.txCount > 0);
  const txCount = active.reduce((s, a) => s + a.txCount, 0);
  const volumeUsd = active.reduce((s, a) => s + a.volumeUsd, 0);
  const appsUsed = active.length;
  const walletAgeMonths = monthsBetween(profile.firstSeen);
  const avgTicket = txCount > 0 ? volumeUsd / txCount : 0;

  const consistency =
    walletAgeMonths === 0 ? (txCount > 0 ? 1 : 0) : Math.min(1, profile.activeMonths / walletAgeMonths);
  const reach = appsUsed / TOP_APPS.length;
  const usage = logCalib(txCount, CAL.txCountP99);
  const magnitude = logCalib(volumeUsd, CAL.volumeP99);
  const bonaFides =
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
      detail: `Used ${appsUsed} of ${TOP_APPS.length} tracked apps`,
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
      key: "bonaFides",
      label: "Bona fides",
      weight: WEIGHTS.bonaFides,
      raw: bonaFides,
      points: Math.round(bonaFides * WEIGHTS.bonaFides * 1000),
      detail: `${walletAgeMonths} months tenure, $${Math.round(avgTicket).toLocaleString()} avg ticket`,
    },
  ];

  const fullStackBonus = appsUsed === TOP_APPS.length ? FULL_STACK_BONUS : 0;
  const score = Math.min(1000, factors.reduce((s, f) => s + f.points, 0) + fullStackBonus);

  // Bands calibrated so grade A is roughly the top decile of the network.
  const grade: Grade = score >= 800 ? "A" : score >= 450 ? "B" : "C";
  const bandFloor = grade === "A" ? 800 : grade === "B" ? 450 : 0;
  const bandCeil = grade === "A" ? 1000 : grade === "B" ? 800 : 450;
  const pos = (score - bandFloor) / (bandCeil - bandFloor);
  const modifier = pos >= 0.66 ? "+" : pos < 0.2 ? "-" : "";

  const { archetype, archetypeNote } = classifyArchetype({ usage, magnitude, reach, consistency, txCount });

  return {
    address: profile.address,
    score,
    grade,
    modifier,
    archetype,
    archetypeNote,
    factors,
    fullStackBonus,
    totals: { txCount, volumeUsd, appsUsed, walletAgeMonths, activeMonths: profile.activeMonths },
    sbt: {
      minted: txCount > 0,
      tokenId: `CKE-${(hashSeed(profile.address.toLowerCase()) % 1_000_000).toString().padStart(6, "0")}`,
      standard: "ERC-5192 (soulbound, non-transferable)",
      note: "Testnet attestation — the mainnet SBT program requires wallet-owner opt-in.",
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
  if (s.usage >= 0.55 && s.magnitude >= 0.55 && s.reach >= 0.8)
    return {
      archetype: "Blue Chip",
      archetypeNote: "High activity, high volume, present across the app set.",
    };
  if (s.reach >= 0.8)
    return { archetype: "Explorer", archetypeNote: "Broad app coverage with moderate depth." };
  if (s.consistency >= 0.6)
    return { archetype: "Regular", archetypeNote: "Steady month-over-month activity." };
  return { archetype: "Tourist", archetypeNote: "Light or sporadic activity so far." };
}
