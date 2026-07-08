import GradeSeal from "@/components/GradeSeal";

export const metadata = { title: "Methodology — Visa Wallet Rating" };

// Reference categorical palette (validated for the light surface); identity
// is carried by direct labels.
const FACTORS = [
  { letter: "C", name: "Consistency", weight: 15, color: "#2a78d6", ink: "#ffffff", d: "Share of months active since first seen — sustained use beats one spike." },
  { letter: "R", name: "Reach", weight: 20, color: "#1baf7a", ink: "#101828", d: "Breadth across the chain's top-10 apps — the strongest sybil-resistance signal." },
  { letter: "U", name: "Usage", weight: 25, color: "#eda100", ink: "#101828", d: "Transaction count, log-calibrated." },
  { letter: "M", name: "Magnitude", weight: 25, color: "#008300", ink: "#ffffff", d: "USD volume, log-calibrated — equal weight to Usage, so whales and power users both reach A." },
  { letter: "B", name: "Bedrock", weight: 15, color: "#4a3aa7", ink: "#ffffff", d: "Wallet tenure plus average ticket size — costly to fake at scale." },
];

// Rendered best-first: A on the left, descending to C.
const BANDS = [
  { g: "A" as const, from: 800, to: 1000, d: "Top decile" },
  { g: "B" as const, from: 450, to: 799, d: "Established" },
  { g: "C" as const, from: 0, to: 449, d: "Developing" },
];

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-20 pb-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">One number. Five factors.</h1>
        <p className="mt-4 text-muted max-w-xl mx-auto">
          A wallet&apos;s full on-chain history, distilled to a 0–1000 score and a letter grade. Explainable by
          construction — every score decomposes into the five factors below.
        </p>
      </div>

      {/* Weight composition bar */}
      <section className="mt-14">
        <div className="flex h-12 w-full overflow-hidden rounded-lg" role="img" aria-label="Score composition: Consistency 15%, Reach 20%, Usage 25%, Magnitude 25%, Bedrock 15%">
          {FACTORS.map((f, i) => (
            <div
              key={f.letter}
              className="flex items-center justify-center font-semibold text-sm"
              style={{ width: `${f.weight}%`, background: f.color, color: f.ink, marginLeft: i === 0 ? 0 : 2 }}
            >
              {f.weight}%
            </div>
          ))}
        </div>
        <div className="mt-2 flex text-xs text-muted">
          {FACTORS.map((f, i) => (
            <span key={f.letter} className="text-center font-medium" style={{ width: `${f.weight}%`, marginLeft: i === 0 ? 0 : 2 }}>
              {f.name}
            </span>
          ))}
        </div>
      </section>

      {/* Factors, one line each */}
      <section className="mt-10 space-y-2.5">
        {FACTORS.map((f) => (
          <div key={f.letter} className="rounded-xl border border-line bg-surface px-5 py-4 flex gap-4 items-center">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base font-bold"
              style={{ background: f.color, color: f.ink }}
            >
              {f.letter}
            </div>
            <p className="text-sm text-muted">
              <strong className="text-foreground">{f.name}.</strong> {f.d}
            </p>
          </div>
        ))}
        <p className="text-xs text-faint pt-1">
          Bonuses, capped at 1000: +50 Full-Stack (5+ tracked apps) · +50 KYC attestation.
        </p>
      </section>

      {/* Grade spectrum */}
      <section className="mt-14">
        <div className="flex h-9 w-full overflow-hidden rounded-lg" role="img" aria-label="Grade bands, best first: A from 1000 down to 800, B to 450, C to 0">
          {BANDS.map((b, i) => (
            <div
              key={b.g}
              className="flex items-center justify-center text-white text-sm font-bold"
              style={{ width: `${((b.to - b.from + 1) / 1001) * 100}%`, background: `var(--grade-${b.g.toLowerCase()})`, marginLeft: i === 0 ? 0 : 2 }}
            >
              {b.g}
            </div>
          ))}
        </div>
        <div className="mt-1.5 relative h-4 text-[11px] text-faint tabular-nums">
          <span className="absolute left-0">1000</span>
          <span className="absolute" style={{ left: "20%" }}>800</span>
          <span className="absolute" style={{ left: "55%" }}>450</span>
          <span className="absolute right-0">0</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {BANDS.map((b) => (
            <div key={b.g} className="rounded-xl border border-line bg-surface p-4 flex items-center gap-4">
              <GradeSeal grade={b.g} size="sm" />
              <div>
                <div className="font-semibold text-sm">{b.d}</div>
                <div className="font-mono text-xs text-muted mt-0.5">{b.from}–{b.to}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tiers, one strip */}
      <section className="mt-14 rounded-xl border border-line bg-surface p-5">
        <p className="text-sm text-muted leading-relaxed">
          <strong className="text-foreground">Identity changes the tier, not the math.</strong>{" "}
          <strong style={{ color: "var(--grade-a)" }}>Prime</strong> = KYC attestation + grade A ·{" "}
          <strong className="text-accent">Verified</strong> = KYC, any grade ·{" "}
          <strong className="text-foreground">Standard</strong> = activity only ·{" "}
          <strong style={{ color: "var(--grade-c)" }}>Restricted</strong> = OFAC SDN match, score suppressed.
          Every lookup is screened.
        </p>
      </section>
    </div>
  );
}
