import type { WalletRow } from "./model";

/**
 * Deterministic synthetic portfolio — used ONLY when the database is
 * unreachable (e.g. local dev outside the deployment network), so the tool
 * always renders. Clearly flagged in the UI as demo data.
 */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function demoPortfolio(n = 1000): WalletRow[] {
  const rand = mulberry32(20260722);
  const rows: WalletRow[] = [];
  const ARCH = ["Blue Chip", "Whale", "Power User", "Explorer", "Regular", "Tourist"];
  for (let i = 0; i < n; i++) {
    // Long-tailed activity: most wallets thin, a few heavy.
    const heavy = rand() < 0.12;
    const whale = rand() < 0.06;
    const txCount = Math.floor(heavy ? 200 + rand() * 3000 : rand() * 120);
    const avgTicket = whale ? 5_000 + rand() * 120_000 : 20 + rand() * 2_500;
    const volumeUsd = Math.round(txCount * avgTicket);
    const appsUsed = Math.min(10, Math.floor(heavy ? 3 + rand() * 7 : rand() * 4));
    const kycVerified = rand() < 0.22;
    const sanctioned = rand() < 0.012;
    const addr = `0x${Array.from({ length: 40 }, () => "0123456789abcdef"[Math.floor(rand() * 16)]).join("")}`;
    rows.push({
      address: addr,
      txCount,
      volumeUsd,
      appsUsed,
      kycVerified,
      sanctioned,
      archetype: sanctioned ? "Sanctioned" : ARCH[Math.floor(rand() * ARCH.length)],
      baselineScore: 0, // filled by caller with baseline levers
    });
  }
  return rows;
}
