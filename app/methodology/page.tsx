import GradeSeal from "@/components/GradeSeal";

export const metadata = { title: "Methodology — Halbrook" };

// Reference categorical palette (validated for the light surface) for the
// factor-weight composition bar; identity is carried by direct labels.
const FACTORS = [
  { letter: "C", name: "Consistency", weight: 15, color: "#2a78d6", ink: "#ffffff", what: "Share of months active since the wallet was first seen.", why: "Separates sustained participants from wallets that spiked once and went dark." },
  { letter: "R", name: "Reach", weight: 20, color: "#1baf7a", ink: "#101828", what: "Breadth across the chain's top-10 tracked apps. 5+ apps earns a +50 Full-Stack bonus.", why: "Cross-app presence is the strongest sybil-resistance signal — farming many distinct protocols convincingly is expensive." },
  { letter: "U", name: "Usage", weight: 25, color: "#eda100", ink: "#101828", what: "Transaction count across tracked apps, log-calibrated.", why: "Rewards frequency. Going from 10 to 100 transactions matters more than 1,000 to 1,100." },
  { letter: "M", name: "Magnitude", weight: 25, color: "#008300", ink: "#ffffff", what: "Lifetime USD volume, log-calibrated.", why: "Rewards economic weight — weighted equal to Usage so whales and power users both reach A." },
  { letter: "B", name: "Bedrock", weight: 15, color: "#4a3aa7", ink: "#ffffff", what: "Wallet tenure plus average ticket size.", why: "Old wallets with meaningful ticket sizes are costly to fake at scale." },
];

const BANDS = [
  { g: "C" as const, from: 0, to: 449, d: "Developing — new, light, or dormant. A starting point, not a scarlet letter." },
  { g: "B" as const, from: 450, to: 799, d: "Established — real but unremarkable activity." },
  { g: "A" as const, from: 800, to: 1000, d: "Top decile — deep, broad, or economically heavy." },
];

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pt-14 pb-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">One number. Five factors.</h1>
        <p className="mt-4 text-muted max-w-xl mx-auto">
          The Halbrook Score distills a wallet&apos;s full on-chain history into a 0–1000 score and a letter grade —
          explainable by construction, no black box.
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

      {/* Factor detail */}
      <section className="mt-12 space-y-3">
        {FACTORS.map((f) => (
          <div key={f.letter} className="rounded-xl border border-line bg-surface p-5 flex gap-5 items-start">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-bold"
              style={{ background: f.color, color: f.ink }}
            >
              {f.letter}
            </div>
            <div>
              <div className="flex items-baseline gap-3">
                <h2 className="font-semibold">{f.name}</h2>
                <span className="text-xs text-faint">{f.weight}% of score</span>
              </div>
              <p className="mt-1 text-sm text-muted">{f.what}</p>
              <p className="mt-1 text-sm text-faint italic">{f.why}</p>
            </div>
          </div>
        ))}
        <p className="text-xs text-faint pt-1">
          Bonuses on top, capped at 1000: +50 Full-Stack (5+ tracked apps) · +50 KYC attestation.
        </p>
      </section>

      {/* Grade spectrum */}
      <section className="mt-16">
        <h2 className="text-xl font-semibold tracking-tight text-center">The grade spectrum</h2>
        <div className="mt-6 flex h-9 w-full overflow-hidden rounded-lg" role="img" aria-label="Grade bands: C from 0 to 449, B from 450 to 799, A from 800 to 1000">
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
          <span className="absolute left-0">0</span>
          <span className="absolute" style={{ left: "45%" }}>450</span>
          <span className="absolute" style={{ left: "80%" }}>800</span>
          <span className="absolute right-0">1000</span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[...BANDS].reverse().map((b) => (
            <div key={b.g} className="rounded-xl border border-line bg-surface p-5 flex flex-col items-center text-center">
              <GradeSeal grade={b.g} size="sm" />
              <span className="mt-3 font-mono text-xs text-muted">{b.from}–{b.to}</span>
              <p className="mt-2 text-sm text-muted">{b.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-faint text-center">
          Modifiers: “+” in the top third of a band, “−” in the bottom fifth. Grade A calibrated to roughly the top
          decile of the network.
        </p>
      </section>

      {/* Trust tiers */}
      <section className="mt-16">
        <h2 className="text-xl font-semibold tracking-tight text-center">Identity changes the tier, not the math</h2>
        <p className="mt-3 text-sm text-muted text-center max-w-xl mx-auto">
          Activity proves a wallet is real. Identity proves who stands behind it. Sanctions screening decides whether
          it can be served at all.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {[
            { t: "Prime", c: "var(--grade-a)", d: "KYC attestation + grade A. The top of the network. KYC adds +50." },
            { t: "Verified", c: "var(--accent)", d: "KYC attestation present (Coinbase Verifications via EAS on Base), any grade." },
            { t: "Standard", c: "var(--muted)", d: "No attestation — rated on activity alone." },
            { t: "Restricted", c: "var(--grade-c)", d: "OFAC SDN match. Score suppressed to 0; explicit API flag. Every lookup and ingest batch is screened." },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-line bg-surface p-5">
              <div className="text-sm font-bold" style={{ color: x.c }}>{x.t}</div>
              <p className="mt-2 text-xs text-muted leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="mt-16 mb-4">
        <h2 className="text-xl font-semibold tracking-tight text-center">Design principles</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            { t: "Two paths to the top", d: "Usage and Magnitude carry equal weight: 12 large transactions or 1,200 small ones both reach A." },
            { t: "Breadth beats depth", d: "A wallet active across many tracked apps outranks a single-app wallet with identical totals." },
            { t: "Log everything", d: "On-chain activity is power-law distributed; log calibration keeps the middle of the curve meaningful." },
            { t: "Consent-first attestation", d: "Scores are computed from public data; the soulbound credential is minted only when the owner claims it." },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-line bg-surface p-5">
              <h3 className="font-semibold text-sm">{x.t}</h3>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
