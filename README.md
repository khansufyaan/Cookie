# 🍪 Cookie — Wallet Ratings

Cookie rates crypto wallets **A, B, or C** from their activity across the top apps on-chain. Apps push user activity through an ingest API and get ratings back; wallet owners look up their score, see exactly what drives it, and claim it as a soulbound attestation.

**MVP status: demo tier.** All wallet profiles are synthesized deterministically from the address (same address → same report, no database needed). The scoring engine, API surface, and dashboard are real; the indexer that replaces synthetic data with on-chain history is the next milestone.

## The CRUMB Score

Proprietary 0–1000 rubric, five factors (see `/methodology` in the app):

| Factor | Weight | Signal |
|---|---|---|
| **C**onsistency | 15% | Share of months active since first seen |
| **R**each | 20% | Breadth across the tracked app set (+50 Full-Stack bonus for all 5) |
| **U**sage | 25% | Transaction count, log-calibrated |
| **M**agnitude | 25% | USD volume, log-calibrated |
| **B**ona fides | 15% | Wallet tenure + average ticket size |

Usage and Magnitude are weighted equally so **whales** (few large transactions) and **power users** (many small ones) both have a path to grade A. Grades: A ≥ 800 (~top decile), B ≥ 450, C below.

## Launch app set

Bootstrapped from wallets interacting with five real mainnet contracts: Uniswap (Universal Router), OpenSea (Seaport 1.6), Aave (V3 Pool), Lido (stETH), Blur (Marketplace).

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
