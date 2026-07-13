import Link from "next/link";

export const metadata = { title: "Who it's for — Visa Wallet Rating" };

const LOOP = [
  { n: "1", t: "Apps report", d: "An app shares what it saw: repaid or defaulted, verified or not, active or gone." },
  { n: "2", t: "The score moves", d: "Each report nudges that wallet's grade up or down." },
  { n: "3", t: "Everyone benefits", d: "Now every app sees the full picture — not just its own corner." },
];

const AUDIENCES = [
  {
    who: "New app developers",
    title: "Know your users from day one.",
    points: [
      "Learn about a new user the moment they connect — no history of your own needed.",
      "Spot risky or sanctioned wallets before they transact.",
      "Start with the same insight the biggest apps already have.",
    ],
    cta: "Read the API docs →",
    href: "/developers",
  },
  {
    who: "Established apps & exchanges",
    title: "Share data, get ratings free.",
    points: [
      "Share what you know about wallets — KYC, activity, fraud — with Visa.",
      "Get ratings back for free, including every other app's signal.",
      "Support the ecosystem — one shared standard makes everyone safer.",
    ],
    cta: "Start sharing →",
    href: "/developers",
  },
  {
    who: "Consumers",
    title: "Understand and improve your score.",
    points: [
      "See your on-chain behavior in one clear score.",
      "Learn exactly what drives your grade and how to raise it.",
      "Carry a portable rating that unlocks better rates and access.",
    ],
    cta: "Build your score →",
    href: "/claim",
  },
];

export default function WhyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-14 pb-8">
      {/* The problem */}
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">The problem</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Apps don&apos;t share what they know.</h1>
      <p className="mt-4 text-lg text-muted leading-relaxed">
        One wallet uses many apps — but each app only sees its own corner. So a great customer looks like a stranger
        everywhere new, and a bad actor gets a fresh start every time. There&apos;s no shared record.
      </p>

      {/* The fix — the reporting loop */}
      <section className="mt-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">The fix</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight">One score, built by everyone.</h2>
        <p className="mt-3 text-base text-muted leading-relaxed">
          Apps report what they see about a wallet. Each report moves its score up or down. In return, every app gets
          to see what all the others reported — through one neutral party, so no one shares data with a rival.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {LOOP.map((s) => (
            <div key={s.n} className="rounded-2xl border border-line bg-surface p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">{s.n}</span>
              <h3 className="mt-3 font-semibold">{s.t}</h3>
              <p className="mt-1.5 text-base text-muted leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="mt-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Who it&apos;s for</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {AUDIENCES.map((a) => (
            <div key={a.who} className="flex flex-col rounded-2xl border border-line bg-surface p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">{a.who}</p>
              <h3 className="mt-2 text-lg font-bold tracking-tight">{a.title}</h3>
              <ul className="mt-4 space-y-2.5 flex-1">
                {a.points.map((p) => (
                  <li key={p} className="flex gap-2.5 text-sm text-muted leading-snug">
                    <span className="mt-0.5 shrink-0" style={{ color: "var(--grade-a)" }}>✓</span>
                    {p}
                  </li>
                ))}
              </ul>
              <Link href={a.href} className="mt-5 text-sm font-semibold text-accent hover:text-accent-strong">
                {a.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-2xl bg-foreground px-6 py-8 sm:px-10 text-background">
        <p className="text-lg sm:text-xl font-semibold leading-relaxed">
          No app sees the whole picture alone. Together, they can — and every honest wallet gets a score it can build
          and take anywhere.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3 text-sm">
        <Link href="/network" className="rounded-lg border border-line-strong px-4 py-2.5 font-medium hover:border-accent">
          See the live network →
        </Link>
        <Link href="/developers" className="rounded-lg border border-line-strong px-4 py-2.5 font-medium hover:border-accent">
          Report on wallets →
        </Link>
        <Link href="/claim" className="rounded-lg bg-accent px-4 py-2.5 font-semibold text-white hover:bg-accent-strong">
          Build your score →
        </Link>
      </div>
    </div>
  );
}
