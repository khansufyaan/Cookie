# 🍪 Cookie — Wallet Ratings

Cookie rates crypto wallets **A, B, or C** from their activity across the top apps on-chain. Apps push user activity through an ingest API and get ratings back; wallet owners look up their score, see exactly what drives it, and claim it as a soulbound attestation.

**MVP status: hybrid.** Ethereum lookups read **live mainnet data** (Blockscout; most recent ~250 outgoing transactions matched against the tracked contracts), are screened against a committed **OFAC SDN snapshot**, and checked for a **KYC attestation** (Coinbase Verifications via EAS on Base). Solana lookups and the example profiles are demo tier — synthesized deterministically from the address — until the Solana indexer is connected.

## The CRUMB Score

Proprietary 0–1000 rubric, five factors (see `/methodology` in the app):

| Factor | Weight | Signal |
|---|---|---|
| **C**onsistency | 15% | Share of months active since first seen |
| **R**each | 20% | Breadth across the chain's top-10 tracked apps (+50 Full-Stack bonus at 5+) |
| **U**sage | 25% | Transaction count, log-calibrated |
| **M**agnitude | 25% | USD volume, log-calibrated |
| **B**edrock | 15% | Wallet tenure + average ticket size |

Usage and Magnitude are weighted equally so **whales** (few large transactions) and **power users** (many small ones) both have a path to grade A. Grades: A ≥ 800 (~top decile), B ≥ 450, C below.

**Trust tiers** layer identity and compliance on top: **Prime** (KYC + grade A), **Verified** (KYC), **Standard**, **Restricted** (OFAC SDN match — score suppressed, explicit `ofacSanctioned` flag). KYC adds a +50 bonus.

## Tracked app set — top 10 by volume, per chain

**Ethereum/EVM:** Uniswap, Aave, Lido, Morpho, Curve, 1inch, Polymarket (Polygon), Ethena, EigenLayer, Pendle.
**Solana:** Jupiter, Raydium, Orca, Pump.fun, PumpSwap, Meteora, Kamino, Drift, Jito, Marinade.

## API

- `GET /api/v1/score/:address` — full rating: score, grade, factor decomposition, totals
- `POST /api/v1/ingest` — partner apps report wallet activity (≤500/batch), receive A/B/C ratings back
- `GET /api/v1/stats` — network aggregates

## Develop

```bash
npm install
npm run dev    # http://localhost:3000
npm run build
```

Next.js 15 (App Router) + TypeScript + Tailwind v4. Scoring engine in `lib/scoring.ts`, demo data layer in `lib/wallets.ts`.

## Important design decisions (read before pitching this)

- **Attestations are opt-in.** Ratings are computed from public data, but the soulbound token is only minted when the owner claims it. Stealth-minting tokens to wallets pattern-matches dusting attacks, is hidden by default in major wallets, and creates severe GDPR/FCRA exposure. See `docs/IDEA-REVIEW.md`.
- **Portability is revoke-and-reissue,** signed by both wallets and logged — never a transfer, which would create a market for scored wallets and break sybil-resistance.
- **The name "Cookie" has a serious conflict** with Cookie DAO / Cookie3 (Binance-listed COOKIE token, wallet-analytics company). See `docs/IDEA-REVIEW.md`.
