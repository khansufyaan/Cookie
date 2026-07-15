import Link from "next/link";
import AppLogo from "@/components/AppLogo";
import GradeSeal from "@/components/GradeSeal";
import { EVM_APPS, SOL_APPS } from "@/lib/apps";

export const metadata = { title: "Methodology — Visa Wallet Rating" };

// Reference categorical palette (validated for the light surface); identity
// is carried by direct labels.
const FACTORS = [
  { letter: "C", name: "Consistency", weight: 15, color: "#2a78d6", ink: "#ffffff", d: "How many months you stay active." },
  { letter: "R", name: "Reach", weight: 20, color: "#1baf7a", ink: "#101828", d: "How many tracked apps you use." },
  { letter: "U", name: "Usage", weight: 25, color: "#eda100", ink: "#101828", d: "How often you transact." },
  { letter: "M", name: "Magnitude", weight: 25, color: "#008300", ink: "#ffffff", d: "How much volume you move." },
  { letter: "B", name: "Bedrock", weight: 15, color: "#4a3aa7", ink: "#ffffff", d: "How long you've held, and how big your transactions are." },
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
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">What builds your wallet rating</h1>
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

      {/* Factors — one bold row each, explanation set to the right */}
      <section className="mt-10 space-y-3">
        {FACTORS.map((f) => (
          <div key={f.letter} className="rounded-2xl border border-line bg-surface px-5 sm:px-7 py-5 flex items-center gap-5">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl font-bold"
              style={{ background: f.color, color: f.ink }}
            >
              {f.letter}
            </div>
            <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <span className="text-xl font-bold tracking-tight">{f.name}</span>
              <span className="text-base text-muted leading-snug sm:text-right sm:max-w-[52%]">{f.d}</span>
            </div>
          </div>
        ))}
        <p className="text-sm text-faint pt-2">
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
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-center">The tracked apps</h2>
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
                <Link
                  key={a.id}
                  href={`/apps/${a.id}`}
                  className="rounded-xl border border-line bg-surface px-4 py-3 flex items-center gap-3 hover:border-accent transition-colors group"
                >
                  <AppLogo domain={a.domain} name={a.name} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm">{a.name}</div>
                    <div className="text-xs text-faint">
                      {a.category} · {a.chain}
                    </div>
                  </div>
                  <span className="text-xs text-faint group-hover:text-accent whitespace-nowrap">
                    Contracts →
                  </span>
                </Link>
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
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-center">How to raise your rating</h2>
        <div className="mt-8 space-y-2">
          {[
            { f: FACTORS[0], action: "Stay active every month" },
            { f: FACTORS[1], action: "Use more tracked apps" },
            { f: FACTORS[2], action: "Transact more often" },
            { f: FACTORS[3], action: "Move more volume" },
            { f: FACTORS[4], action: "Hold longer, transact bigger" },
          ].map(({ f, action }) => (
            <div key={f.letter} className="rounded-xl border border-line bg-surface px-5 py-4 flex items-center gap-4">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base font-bold"
                style={{ background: f.color, color: f.ink }}
              >
                {f.letter}
              </div>
              <h3 className="flex-1 font-semibold">{action}</h3>
              <span className="whitespace-nowrap text-right">
                <span className="text-xs font-medium text-faint mr-1.5">up to</span>
                <span className="text-2xl font-bold tabular-nums" style={{ color: f.color }}>{f.weight * 10}</span>
              </span>
            </div>
          ))}
          {[
            { action: "Use 5+ apps", note: "Full-Stack boost" },
            { action: "Verify your identity", note: "KYC attestation" },
          ].map((b) => (
            <div key={b.action} className="rounded-xl border border-line bg-surface px-5 py-4 flex items-center gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base font-bold text-white" style={{ background: "var(--grade-a)" }}>
                ✓
              </div>
              <h3 className="flex-1 font-semibold">
                {b.action} <span className="ml-2 text-xs font-medium text-faint">{b.note}</span>
              </h3>
              <span className="text-2xl font-bold tabular-nums whitespace-nowrap" style={{ color: "var(--grade-a)" }}>
                +50
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-faint text-center">
          Wash-trading doesn&apos;t work — dust-sized transactions hurt more than they help.
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
