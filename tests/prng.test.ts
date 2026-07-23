import { describe, expect, it } from "vitest";
import { hashSeed, heavyTail, mulberry32 } from "@/lib/prng";

describe("hashSeed", () => {
  it("is deterministic", () => {
    expect(hashSeed("abc")).toBe(hashSeed("abc"));
  });
  it("differs for different inputs and stays a uint32", () => {
    const a = hashSeed("0xaaa");
    const b = hashSeed("0xbbb");
    expect(a).not.toBe(b);
    for (const v of [a, b]) {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(0xffffffff);
    }
  });
});

describe("mulberry32", () => {
  it("produces a reproducible stream in [0,1)", () => {
    const gen = mulberry32(12345);
    const seq = Array.from({ length: 100 }, () => gen());
    for (const v of seq) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    // Same seed => same sequence.
    const gen2 = mulberry32(12345);
    expect(Array.from({ length: 100 }, () => gen2())).toEqual(seq);
  });
});

describe("heavyTail", () => {
  it("never exceeds the cap and is non-negative", () => {
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const v = heavyTail(Math.min(u, 1), 1000);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1000);
    }
  });
});
