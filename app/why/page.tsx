import Link from "next/link";

export const metadata = { title: "Why Visa — Visa Wallet Rating" };

const REASONS = [
  {
    n: "01",
    who: "For new apps",
    title: "Know who just walked in.",
    body: "A wallet connects to your app for the first time. On your own, you know nothing about it — no history, no context, a cold start. Visa hands you the picture instantly: is this a real, active user with a track record across the ecosystem, or a brand-new, thin, or sanctioned address? It's the cookie moment for crypto — the visitor arrives already understood, so you can treat a power user like one and keep bad actors out from the very first transaction.",
    take: "No cold start. Every wallet arrives with context.",
  },
  {
    n: "02",
    who: "For established apps",
    title: "Share signal, get the whole ecosystem back.",
    body: "You see things about your users the chain never will — whether they passed KYC, whether they're genuinely active, whether they ever charged back or got flagged. Share those off-chain signals with Visa, and in return read what every other app has shared — for free. Visa sits in the middle as the neutral party: no app hands data to a direct competitor, because everyone reports to the bureau, not to each other. The whole ecosystem gets safer, and your view of each user gets richer than anything you could build alone.",
    take: "Contribute what only you can see. Receive what everyone else can't.",
  },
  {
    n: "03",
    who: "For consumers",
    title: "Understand your score, unlock better offers.",
    body: "Your rating isn't a black box. See exactly what drives it and how to raise it — then carry it everywhere as a pass you own. A strong, portable grade means apps can offer you what they reserve for their best users: better rates, higher limits, lower fees, earlier access — without making you re-earn trust from scratch at every new app you touch.",
    take: "One grade you own, recognized everywhere.",
  },
];

export default function WhyPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pt-14 pb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Why Visa</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">The neutral layer between every app.</h1>
      <p className="mt-4 text-lg text-muted max-w-2xl leading-relaxed">
        The web has the cookie — a shared way for a site to understand who just arrived. Crypto has wallets, but no
        neutral party to vouch for them. Visa is that layer: apps share what they know, and everyone gets a clearer,
        safer view of who they&apos;re dealing with — without handing data to a competitor.
      </p>

      <div className="mt-12 space-y-4">
        {REASONS.map((r) => (
          <section key={r.n} className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <div className="flex items-baseline gap-4">
              <span className="visa-wordmark text-2xl" style={{ color: "var(--accent)" }}>{r.n}</span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">{r.who}</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight">{r.title}</h2>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted leading-relaxed">{r.body}</p>
            <p className="mt-4 border-l-2 border-accent pl-3 text-sm font-medium text-foreground">{r.take}</p>
          </section>
        ))}
      </div>

      <section className="mt-14 rounded-2xl bg-foreground px-6 py-8 sm:px-10 text-background">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">The one-line version</p>
        <p className="mt-3 text-lg sm:text-xl font-semibold leading-relaxed">
          Visa is the neutral off-chain data layer between apps — the trusted middle that lets the whole ecosystem
          understand its users, so builders start warm, partners share safely, and consumers carry one grade everywhere.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3 text-sm">
        <Link href="/network" className="rounded-lg border border-line-strong px-4 py-2.5 font-medium hover:border-accent">
          See the live network →
        </Link>
        <Link href="/developers" className="rounded-lg border border-line-strong px-4 py-2.5 font-medium hover:border-accent">
          Share data &amp; partner →
        </Link>
        <Link href="/claim" className="rounded-lg bg-accent px-4 py-2.5 font-semibold text-white hover:bg-accent-strong">
          See your score →
        </Link>
      </div>
    </div>
  );
}
