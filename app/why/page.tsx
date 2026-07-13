import Link from "next/link";

export const metadata = { title: "Who it's for — Visa Wallet Rating" };

const LOOP = [
  { n: "1", t: "Apps report", d: "Each app reports what it sees on a wallet — repaid or defaulted, KYC'd or anonymous, active or abandoned, flagged or clean." },
  { n: "2", t: "The score moves", d: "Every report nudges that wallet's grade up or down. The rating reflects behavior across the whole ecosystem, not one app's slice." },
  { n: "3", t: "Everyone reads it", d: "In return, every app reads the pooled result from all the others — a fuller picture than any of them could build alone." },
];

const AUDIENCES = [
  {
    who: "For apps & exchanges",
    title: "Stop flying blind on new wallets.",
    body: "Report what you see, and in return get every other app's signal back — identity, activity, repayment, fraud — through one neutral source. You never hand data straight to a competitor; you report to the bureau, and the bureau gives you the whole picture.",
    cta: "Report on wallets →",
    href: "/developers",
  },
  {
    who: "For consumers",
    title: "Build your score over time.",
    body: "Good behavior on every app compounds into one portable grade. Instead of re-earning trust from scratch at each new app, you carry a rating that unlocks better rates, higher limits, and earlier access — the more you use the ecosystem well, the more it works for you.",
    cta: "Build your score →",
    href: "/claim",
  },
];

export default function WhyPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pt-14 pb-8">
      {/* The problem */}
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">The problem</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Apps don&apos;t share what they know.</h1>
      <p className="mt-4 text-lg text-muted max-w-2xl leading-relaxed">
        A single wallet might borrow on one app, trade on another, and get banned on a third — but none of those apps
        can see the others. Every app judges a wallet on its own thin slice of history, so a proven user looks like a
        stranger and a known bad actor gets a clean slate every time they show up somewhere new. There has never been a
        credit bureau for wallets.
      </p>

      {/* The fix — the reporting loop */}
      <section className="mt-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">The fix</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight">One shared score, reported by everyone.</h2>
        <p className="mt-3 text-sm text-muted max-w-2xl leading-relaxed">
          Visa Wallet Rating is where apps report on the wallets they see — and each report moves that wallet&apos;s
          credit score up or down. A neutral party sits in the middle, so apps get the benefit of shared data without
          ever handing it to a rival.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {LOOP.map((s) => (
            <div key={s.n} className="rounded-2xl border border-line bg-surface p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">{s.n}</span>
              <h3 className="mt-3 font-semibold">{s.t}</h3>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted max-w-2xl">
          It&apos;s the credit-bureau model, ported to crypto: lenders report behavior, and everyone reads a score
          trained on the pooled result — one no single app could produce on its own.
        </p>
      </section>

      {/* Who it's for */}
      <section className="mt-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Who it&apos;s for</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {AUDIENCES.map((a) => (
            <div key={a.who} className="flex flex-col rounded-2xl border border-line bg-surface p-6 sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">{a.who}</p>
              <h3 className="mt-2 text-xl font-bold tracking-tight">{a.title}</h3>
              <p className="mt-3 text-sm text-muted leading-relaxed flex-1">{a.body}</p>
              <Link href={a.href} className="mt-4 text-sm font-semibold text-accent hover:text-accent-strong">
                {a.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-2xl bg-foreground px-6 py-8 sm:px-10 text-background">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">In one line</p>
        <p className="mt-3 text-lg sm:text-xl font-semibold leading-relaxed">
          No app can see the whole picture of a wallet alone. Together — reporting through one neutral bureau — they
          can, and every honest wallet gets a score it can build and carry everywhere.
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
