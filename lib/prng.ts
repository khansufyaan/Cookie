/**
 * Deterministic PRNG utilities. Every demo profile is derived purely from the
 * wallet address, so the same address always produces the same profile —
 * no database needed for the MVP demo tier.
 */

/** xmur3 string hash -> 32-bit seed */
export function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32 PRNG */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Log-normal-ish heavy-tailed sample in [0, ~cap] from a uniform draw. */
export function heavyTail(u: number, cap: number, skew = 3): number {
  return Math.min(cap, Math.pow(u, skew * 2) * cap * 10);
}
