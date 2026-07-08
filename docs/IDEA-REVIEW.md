# Cookie — Premise Review

An honest, researched challenge of every premise of the Cookie idea, with the competitive landscape as of mid-2026. Written before building the MVP; the MVP's design decisions (opt-in attestation, revoke-and-reissue portability) follow from it.

**Verdict: 4/10 as specified. 7–8/10 potential with three specific changes** (below).

## Premise-by-premise

### 1. "Mint a soulbound token to track wallets — users won't know"

**Fails on every axis.**

- *Technically pointless:* chain history is public; an SBT adds zero data you can't already compute off-chain. You'd pay gas per wallet to write down what you already know.
- *Mechanically invisible:* MetaMask, Rabby, and Coinbase Wallet hide unknown airdropped tokens by default (anti-spam allowlists). The token would never be seen — except by security tools, which classify unsolicited mints alongside dusting attacks.
- *Legally radioactive:* under the EDPB's 2025 blockchain guidelines, wallet addresses linkable to persons are personal data, and the CJEU's SCHUFA ruling (C-634/21) makes producing a credit score that third parties rely on regulated automated decision-making under GDPR Art. 22 — "without the user's knowledge" also violates Arts. 13/14 outright. In the US, "assemble wallet data, sell eligibility ratings of consumers to third parties" maps closely onto the FCRA definition of a consumer reporting agency, with accuracy/dispute/adverse-action duties.
- *No precedent:* every live scoring project (Nomis, Trusta, formerly DegenScore) has the **user** mint their own score credential. Nobody stealth-mints; the only unsolicited-token industry is scams.

**Fix:** compute ratings from public data freely, but make the on-chain artifact an **opt-in claim** (EAS attestation on Base, not a bespoke SBT). Claiming is the activation event — it's also your user-acquisition funnel.

### 2. "Rate wallets A/B/C and sell ratings to apps via API"

**Half-validated.** dApps demonstrably pay for wallet intelligence in three forms: airdrop sybil filtering (LayerZero found 803k sybil wallets and paid Nansen/Chaos Labs plus a bounty program), marketing analytics (Cookie3 had 170+ paying dApp customers), and credit-model APIs (3Jane, a Paradigm-backed undercollateralized lender, buys its on-chain credit model from Cred Protocol).

But the graveyard is instructive: **Spectral ($23M raised) pivoted out, ARCx died and rebranded, CreDA closed, RociFi merged itself away, DegenScore is abandoned.** The common cause: "DeFi credit score" had no recurring buyer once undercollateralized lending imploded (Maple's $36M default, Goldfinch's defaults, TrueFi). Survivors (Cred Protocol, Nomis, Trusta — $3M at $80M valuation, 2.5M attestations) are lean, consent-based, and sell **sybil/segmentation intelligence**, not credit risk.

**Fix:** sell "know your best users / filter your worst" (marketing segmentation + airdrop defense), not "credit rating." Same engine, different — and actually purchased — product.

### 3. "Users can swap their score to another wallet"

**Self-contradictory as stated.** Transferable reputation is exactly what sybil farmers want: it creates a resale market for scored wallets (wallet-aging is already an industrialized farm business). Sismo, the best-known zk reputation-porting project, sunset in 2023. What survives is issuer-controlled **revoke-and-reissue** (both wallets sign, old attestation revoked, migration logged) or zk proofs of "I own a wallet with property X." Never a raw transfer.

The MVP implements revoke-and-reissue semantics in the UI copy and roadmap.

### 4. "Bootstrap by indexing top-5 apps' contracts"

**Sound, and the strongest part of the idea.** The launch set (Uniswap, OpenSea, Aave, Lido, Blur) covers five distinct behavior classes (swaps, NFT retail, lending, staking, NFT pro), which makes cross-app breadth a real signal — farming five distinct protocols convincingly is expensive. Cross-app presence as a trust multiplier survives scrutiny.

Caveat: indexing wallets that touched these contracts is a weekend of Dune/Allium work for anyone. The data is not the moat. The moat candidates are: the partner-ingest network (proprietary off-chain + on-chain joins), the calibration flywheel, and score adoption as a standard.

### 5. "The name: Cookie"

**Taken, badly.** Cookie DAO / Cookie3 (cookie.fun, COOKIE token) is Binance spot-listed (Jan 2025, ATH mcap >$218M) — and its **original business is wallet analytics sold to dApps**, i.e., this product's B2B half. Permanent confusion plus likely trademark exposure. Rename before anything public. (This repo keeps the working title.)

## Scorecard

| Premise | Verdict |
|---|---|
| Stealth SBT tracking | ✗ Dead on arrival — technically redundant, hidden by wallets, legally radioactive |
| A/B/C rating API for apps | ◐ Real but small market; buyers pay for sybil-filtering & segmentation, not "credit" |
| Score portability by transfer | ✗ Breaks sybil-resistance; must be revoke-and-reissue or zk proof |
| Bootstrap from top-5 app contracts | ✓ Sound; cross-app breadth is a real signal (but not a moat by itself) |
| Two-sided data marketplace | ✓ Validated shape (Trusta runs it live) — cold-start is the hard part |
| The name | ✗ Fully occupied by a Binance-listed competitor in the same category |

## What would make it 10/10

1. **Consent as the product, not the obstacle.** "Claim your score" is the growth loop: users mint the attestation to unlock perks at partner apps (fee tiers, allowlists, airdrop multipliers). Every claim is marketing to the next app.
2. **Sell the use case with proven spend:** airdrop sybil defense + best-user segmentation, priced per campaign and per API call (Cred Protocol's pricing shows the shape). Credit comes later, if undercollateralized lending returns at scale (watch 3Jane).
3. **Ship the moat, not the score:** the ingest network's off-chain joins (things not visible on-chain: sessions, referrals, support history) are the only data competitors can't replicate from public chains.
4. **A wedge distribution deal:** one anchor protocol committing to gate a real benefit on Cookie grades at launch beats any amount of indexing.
5. **Rename.**

## Key sources

EDPB Guidelines 02/2025 (edpb.europa.eu) · CJEU SCHUFA C-634/21 analyses (aoshearman.com) · 0xArc rebrand (0xarc.io) · Sismo sunset (paragraph.com/@blog.sismo) · 3Jane docs (docs.3jane.xyz) · Trusta Labs raise (crunchbase.com) · Cookie DAO listing (coingecko.com/en/coins/cookie) · LayerZero sybil program (cryptobriefing.com) · Nomis (docs.nomis.cc) · Cred Protocol (credprotocol.com)
