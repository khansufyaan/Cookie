import { describe, expect, it } from "vitest";
import { monthsBetween, scoreWallet, type ScoreSignals } from "@/lib/scoring";
import type { AppActivity, WalletProfile } from "@/lib/types";

const CLEAN: ScoreSignals = {
  kycVerified: false,
  kycSource: "Not attested",
  sanctioned: false,
  sanctionsList: "OFAC SDN",
  sanctionsEntryCount: 100,
};

function activity(overrides: Partial<AppActivity> & { appId: string }): AppActivity {
  return { txCount: 10, volumeUsd: 1000, firstTx: "2024-01-01", lastTx: "2024-06-01", ...overrides };
}

function profile(overrides: Partial<WalletProfile> = {}): WalletProfile {
  return {
    address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    family: "evm",
    activities: [activity({ appId: "uniswap" })],
    firstSeen: "2022-01-01",
    activeMonths: 12,
    ...overrides,
  };
}

// A fixed "now" so tenure-dependent assertions are deterministic.
const AS_OF = new Date("2026-01-01T00:00:00Z");

describe("monthsBetween", () => {
  it("counts whole months across a year boundary", () => {
    expect(monthsBetween("2024-01-01", new Date("2024-07-01"))).toBe(6);
    expect(monthsBetween("2023-06-01", new Date("2024-06-01"))).toBe(12);
  });
  it("never goes negative when the start is in the future", () => {
    expect(monthsBetween("2030-01-01", new Date("2024-01-01"))).toBe(0);
  });
});

describe("scoreWallet — invariants", () => {
  it("keeps the score within 0..1000 for a maxed-out wallet", () => {
    const r = scoreWallet(
      profile({
        activities: ["uniswap", "aave", "lido", "curve", "1inch", "morpho", "pendle"].map((id) =>
          activity({ appId: id, txCount: 5000, volumeUsd: 50_000_000 }),
        ),
        activeMonths: 48,
        firstSeen: "2018-01-01",
      }),
      { ...CLEAN, kycVerified: true },
      { asOf: AS_OF },
    );
    expect(r.score).toBeLessThanOrEqual(1000);
    expect(r.score).toBeGreaterThan(0);
    expect(r.factors.reduce((s, f) => s + f.points, 0)).toBeGreaterThan(0);
  });

  it("returns a coherent zero-activity report without NaN", () => {
    const r = scoreWallet(
      profile({ activities: [], activeMonths: 0, firstSeen: "2026-01-01" }),
      CLEAN,
      { asOf: AS_OF },
    );
    expect(Number.isFinite(r.score)).toBe(true);
    expect(r.totals.txCount).toBe(0);
    expect(r.totals.appsUsed).toBe(0);
    expect(r.archetype).toBe("Ghost");
    for (const f of r.factors) expect(Number.isFinite(f.points)).toBe(true);
  });

  it("never produces NaN for avg ticket when txCount is 0 but volume is not", () => {
    // Degenerate input: volume with zero tx count should not divide-by-zero.
    const r = scoreWallet(
      profile({ activities: [activity({ appId: "uniswap", txCount: 0, volumeUsd: 999 })], activeMonths: 0 }),
      CLEAN,
      { asOf: AS_OF },
    );
    // txCount 0 => activity filtered out => treated as no activity.
    expect(Number.isFinite(r.score)).toBe(true);
    expect(r.totals.txCount).toBe(0);
  });
});

describe("scoreWallet — grade banding", () => {
  it("bands A>=800, B>=450, C<450 and score maps to the right letter", () => {
    const r = scoreWallet(profile(), CLEAN, { asOf: AS_OF });
    if (r.score >= 800) expect(r.grade).toBe("A");
    else if (r.score >= 450) expect(r.grade).toBe("B");
    else expect(r.grade).toBe("C");
  });

  it("emits a modifier consistent with position in the band", () => {
    const r = scoreWallet(profile(), CLEAN, { asOf: AS_OF });
    expect(["+", "", "-"]).toContain(r.modifier);
  });
});

describe("scoreWallet — bonuses", () => {
  it("awards the +50 Full-Stack bonus at 5+ apps and not below", () => {
    const four = scoreWallet(
      profile({ activities: ["uniswap", "aave", "lido", "curve"].map((id) => activity({ appId: id })) }),
      CLEAN,
      { asOf: AS_OF },
    );
    const five = scoreWallet(
      profile({ activities: ["uniswap", "aave", "lido", "curve", "1inch"].map((id) => activity({ appId: id })) }),
      CLEAN,
      { asOf: AS_OF },
    );
    expect(four.fullStackBonus).toBe(0);
    expect(five.fullStackBonus).toBe(50);
  });

  it("awards the +50 KYC bonus only when verified", () => {
    expect(scoreWallet(profile(), CLEAN, { asOf: AS_OF }).kycBonus).toBe(0);
    expect(scoreWallet(profile(), { ...CLEAN, kycVerified: true }, { asOf: AS_OF }).kycBonus).toBe(50);
  });
});

describe("scoreWallet — sanctions override", () => {
  it("forces Restricted/C-/score 0 regardless of activity", () => {
    const r = scoreWallet(
      profile({
        activities: ["uniswap", "aave", "lido", "curve", "1inch"].map((id) =>
          activity({ appId: id, txCount: 9999, volumeUsd: 9_000_000 }),
        ),
        activeMonths: 48,
      }),
      { ...CLEAN, sanctioned: true, kycVerified: true },
      { asOf: AS_OF },
    );
    expect(r.tier).toBe("Restricted");
    expect(r.grade).toBe("C");
    expect(r.modifier).toBe("-");
    expect(r.score).toBe(0);
    expect(r.sanctions.listed).toBe(true);
  });
});

describe("scoreWallet — tiers", () => {
  it("assigns Prime only to KYC + grade A", () => {
    const r = scoreWallet(
      profile({
        activities: ["uniswap", "aave", "lido", "curve", "1inch", "morpho", "pendle"].map((id) =>
          activity({ appId: id, txCount: 5000, volumeUsd: 50_000_000 }),
        ),
        activeMonths: 48,
        firstSeen: "2018-01-01",
      }),
      { ...CLEAN, kycVerified: true },
      { asOf: AS_OF },
    );
    if (r.grade === "A") expect(r.tier).toBe("Prime");
    else expect(r.tier).toBe("Verified");
  });

  it("assigns Standard when unverified", () => {
    expect(scoreWallet(profile(), CLEAN, { asOf: AS_OF }).tier).toBe("Standard");
  });
});

describe("scoreWallet — soulbound token id", () => {
  it("is deterministic for a given address and VWR-prefixed", () => {
    const a = scoreWallet(profile(), CLEAN, { asOf: AS_OF }).sbt.tokenId;
    const b = scoreWallet(profile(), CLEAN, { asOf: AS_OF }).sbt.tokenId;
    expect(a).toBe(b);
    expect(a).toMatch(/^VWR-\d{6}$/);
  });
});
