import AppLogo from "@/components/AppLogo";
import GradeSeal from "@/components/GradeSeal";
import { EVM_APPS, SOL_APPS } from "@/lib/apps";

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

      {/* The tracked app set */}
      <section id="apps" className="mt-16 scroll-mt-20">
        <h2 className="text-2xl font-bold tracking-tight text-center">The tracked apps</h2>
        <p className="mt-3 text-muted text-center max-w-xl mx-auto text-sm">
          Reach and the Full-Stack bonus are measured against this set — the top apps by volume on each chain,
          recalibrated quarterly. Activity is matched at their primary on-chain entry points.
        </p>
        {(
          [
            { title: "Ethereum", apps: EVM_APPS, live: true },
            { title: "Solana", apps: SOL_APPS, live: true },
          ] as const
        ).map((g) => (
          <div key={g.title} className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-faint text-center">
              {g.title}
              <span className="ml-2 normal-case tracking-normal font-medium" style={{ color: "var(--grade-a)" }}>· live</span>
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {g.apps.map((a) => (
                <div key={a.id} className="rounded-xl border border-line bg-surface px-4 py-3 flex items-center gap-3">
                  <AppLogo domain={a.domain} name={a.name} size={28} />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">{a.name}</div>
                    <div className="text-xs text-faint">
                      {a.category} · {a.chain}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <p className="mt-4 text-xs text-faint text-center">
          Polymarket (Polygon) is listed but not yet indexed — activity there doesn&apos;t count until its
          connection lands.
        </p>
      </section>

      {/* How to raise a rating */}
      <section id="raise" className="mt-16 scroll-mt-20">
        <h2 className="text-2xl font-bold tracking-tight text-center">How to raise your rating</h2>
        <p className="mt-3 text-muted text-center max-w-xl mx-auto text-sm">
          The score only reads on-chain behavior, so every point has a lever you control. Each factor caps at
          weight × 10 points — here is what moves each one.
        </p>
        <div className="mt-8 space-y-2.5">
          {[
            { f: FACTORS[0], action: "Transact in more of the months you hold the wallet", how: "One tracked transaction a month is enough to count the month. Long gaps are what drag this down — a monthly rhythm beats a burst of activity followed by silence." },
            { f: FACTORS[1], action: "Use more of the chain's top-10 tracked apps", how: "Breadth is the heaviest signal after Usage and Magnitude. Each additional tracked app you genuinely use lifts Reach — and at 5+ apps the +50 Full-Stack bonus kicks in on top." },
            { f: FACTORS[2], action: "Transact more often", how: "Counted log-scale, so the climb from 10 to 100 transactions is worth as much as 100 to 1,000. Early transactions are the cheapest points on the whole scorecard." },
            { f: FACTORS[3], action: "Route more of your real volume through tracked apps", how: "Also log-calibrated. Whales reach the ceiling on size alone; everyone else gains by consolidating activity they already do into the tracked app set." },
            { f: FACTORS[4], action: "Let the wallet age — and keep tickets meaningful", how: "Tenure can't be rushed; it accrues on its own. Average ticket size is the half you control: many dust-sized transactions dilute it." },
          ].map(({ f, action, how }) => (
            <div key={f.letter} className="rounded-xl border border-line bg-surface px-5 py-4 flex gap-4">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base font-bold"
                style={{ background: f.color, color: f.ink }}
              >
                {f.letter}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="font-semibold text-sm">{action}</h3>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: f.color }}>
                    {f.name} · up to {f.weight * 10} pts
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted leading-relaxed">{how}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface px-5 py-4">
            <h3 className="font-semibold text-sm" style={{ color: "var(--grade-a)" }}>+50 · Full-Stack bonus</h3>
            <p className="mt-1 text-sm text-muted leading-relaxed">
              Genuine activity in 5 or more tracked apps. Usually the single fastest jump for a wallet already
              active in 3–4.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface px-5 py-4">
            <h3 className="font-semibold text-sm" style={{ color: "var(--grade-a)" }}>+50 · KYC attestation</h3>
            <p className="mt-1 text-sm text-muted leading-relaxed">
              An identity attestation on the wallet — also the only way into the Verified and Prime tiers.
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs text-faint text-center">
          What never helps: wash-trading and self-transfers read as dust-sized tickets and hurt Bedrock more than
          they lift Usage. The rating is calibrated to reward ordinary, sustained, real use.
        </p>
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
