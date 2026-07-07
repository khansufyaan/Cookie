import GradeChip from "@/components/GradeChip";

export const metadata = { title: "Methodology — Cookie" };

const FACTORS = [
  {
    letter: "C",
    name: "Consistency",
    weight: "15%",
    what: "Share of months with at least one transaction since the wallet was first seen.",
    why: "Separates sustained participants from wallets that spiked once and went dark.",
  },
  {
    letter: "R",
    name: "Reach",
    weight: "20%",
    what: "Breadth across the tracked app set. Activity in all five launch apps also earns a flat +50 Full-Stack bonus.",
    why: "Cross-app presence is the strongest sybil-resistance signal we have — farming five distinct protocols convincingly is expensive.",
  },
  {
    letter: "U",
    name: "Usage",
    weight: "25%",
    what: "Total transaction count across tracked apps, on a log calibration curve saturating at ~2,500 txns.",
    why: "Rewards frequency. Log scaling means going from 10 to 100 transactions matters more than 1,000 to 1,100.",
  },
  {
    letter: "M",
    name: "Magnitude",
    weight: "25%",
    what: "Lifetime USD volume moved, log-calibrated, saturating at ~$5M.",
    why: "Rewards economic weight. Deliberately weighted equal to Usage so whales and power users both have a path to A.",
  },
  {
    letter: "B",
    name: "Bona fides",
    weight: "15%",
    what: "Wallet tenure (60% of the factor, full credit at 4 years) plus average ticket size (40%).",
    why: "Old wallets with meaningful average transaction sizes are costly to fake at scale.",
  },
];

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pt-10">
      <h1 className="text-3xl font-bold tracking-tight">The CRUMB Score</h1>
      <p className="mt-3 text-muted max-w-2xl">
        Cookie&apos;s proprietary rating rubric. Five factors, each normalized to 0–1 against network calibration
        curves, weighted into a 0–1000 score, mapped to a letter grade.
      </p>

      {/* Factors */}
      <section className="mt-10 space-y-4">
        {FACTORS.map((f) => (
          <div key={f.letter} className="rounded-xl border border-line bg-surface p-5 flex gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 border border-line-strong text-xl font-bold text-accent">
              {f.letter}
            </div>
            <div>
              <div className="flex items-baseline gap-3">
                <h2 className="font-semibold">{f.name}</h2>
                <span className="text-xs text-faint">{f.weight} of score</span>
              </div>
              <p className="mt-1 text-sm text-muted">{f.what}</p>
              <p className="mt-1 text-sm text-faint italic">{f.why}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Grade bands */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">Grade bands</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { g: "A" as const, range: "800–1000", d: "Top users. Deep, broad, or economically heavy activity. Roughly the top decile of the network." },
            { g: "B" as const, range: "450–799", d: "Average. Established wallets with real but unremarkable activity." },
            { g: "C" as const, range: "0–449", d: "Below average. New, light, or dormant wallets. Not a scarlet letter — a starting point." },
          ].map((b) => (
            <div key={b.g} className="rounded-xl border border-line bg-surface p-5">
              <div className="flex items-center gap-3">
                <GradeChip grade={b.g} />
                <span className="font-mono text-sm text-muted">{b.range}</span>
              </div>
              <p className="mt-3 text-sm text-muted">{b.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-faint">
          Modifiers: “+” in the top third of a band, “−” in the bottom fifth.
        </p>
      </section>

      {/* Design principles */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">Design principles</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted leading-relaxed list-disc pl-5">
          <li>
            <strong className="text-foreground">Two paths to the top.</strong> Usage and Magnitude carry equal weight:
            a whale doing 12 large transactions and a trader doing 1,200 small ones can both reach grade A.
          </li>
          <li>
            <strong className="text-foreground">Breadth beats depth for trust.</strong> Reach plus the Full-Stack bonus
            means a wallet active across all five apps outranks a single-app wallet with identical totals.
          </li>
          <li>
            <strong className="text-foreground">Log everything.</strong> On-chain activity is power-law distributed;
            linear scoring would make the top 1% the only signal. Log calibration keeps the middle of the curve meaningful.
          </li>
          <li>
            <strong className="text-foreground">Explainable by construction.</strong> Every score decomposes into five
            factor contributions shown on the wallet report — no black box.
          </li>
          <li>
            <strong className="text-foreground">Consent-first attestation.</strong> Ratings are computed from public
            data, but the soulbound attestation is only minted when the wallet owner claims it. Portability is a
            revoke-and-reissue flow signed by both wallets, so exactly one attestation exists per identity.
          </li>
        </ul>
      </section>
    </div>
  );
}
