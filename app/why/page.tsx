import Link from "next/link";

export const metadata = { title: "Why Visa — Visa Wallet Rating" };

const PILLARS = [
  {
    n: "01",
    title: "Cross-app aggregation",
    lead: "The view no single app can see.",
    body: "Aave sees Aave. Morpho sees Morpho. An app with an Alchemy key can index its own contracts trivially — but it cannot see how a wallet behaves everywhere else, which is exactly the signal that matters. A wallet that looks thin to one app may be a 3-year, 8-app, seven-figure power user. To replicate the cross-app view, an app would have to build and forever maintain 20+ protocol indexers across every chain. That's our full-time job and their distraction.",
    tag: "Experian's actual moat — one number across every lender, not one bank's ledger.",
  },
  {
    n: "02",
    title: "A neutral, portable standard",
    lead: "The Visa network effect.",
    body: "A grade is only worth something if everyone agrees on it. If Aave computes “Aave Score” and Morpho computes “Morpho Score,” neither is portable and neither trusts the other — that's marketing, not credit. Visa never made its money processing a transaction; the moat is the network — one standard every merchant and issuer agreed to accept. A wallet's pass is valuable because it's the same pass everywhere — a thing no single app can mint.",
    tag: "One neutral issuer that 100 apps consume beats 100 private scores that are noise.",
  },
  {
    n: "03",
    title: "Off-chain fusion",
    lead: "The data an Alchemy key will never return.",
    body: "On-chain history is half a credit file. The other half is off-chain — and it's precisely the half Visa already holds: verified identity / KYC, live sanctions & compliance screening, fraud & chargeback history (the single most valuable dataset in payments), and fiat on/off-ramp behavior. An Alchemy key returns transfers. It will never return “this wallet's owner is KYC-verified, sanctions-clear, and has no fraud history across the card network.”",
    tag: "The difference between a block explorer and a bureau.",
  },
  {
    n: "04",
    title: "The consortium feedback loop",
    lead: "The proprietary, predictive asset.",
    body: "An Alchemy key tells you what a wallet did. It cannot tell you what that behavior led to — did the borrower repay or get liquidated? Charge back the fiat leg? Get flagged as a Sybil ring? Only a network where consuming apps report outcomes back accumulates that labeled data. That's exactly how FICO works: lenders report repayment, the bureau sells back a score trained on the pooled outcomes. It's a cooperative asset that can't be reconstructed from public chain data at any price.",
    tag: "Descriptive becomes predictive: “how likely is this wallet to burn you, specifically.”",
  },
];

const TABLE = [
  ["Own-app activity", true],
  ["Cross-app history", false],
  ["Portable, trusted standard", false],
  ["KYC / sanctions / fraud fusion", false],
  ["Outcome-labeled risk model", false],
] as const;

export default function WhyPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pt-14 pb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Why Visa, and not an Alchemy key</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Raw on-chain data isn&apos;t the product.</h1>
      <p className="mt-4 text-lg text-muted max-w-2xl leading-relaxed">
        It&apos;s public — anyone with an Alchemy key can see what a wallet did. The product is the thing a single app
        <em> structurally cannot</em> build for itself. There are four, and they compound. It&apos;s the credit-bureau
        playbook, ported to crypto — and Visa already owns three of the four inputs.
      </p>

      <div className="mt-12 space-y-4">
        {PILLARS.map((p) => (
          <section key={p.n} className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <div className="flex items-baseline gap-4">
              <span className="visa-wordmark text-2xl" style={{ color: "var(--accent)" }}>{p.n}</span>
              <div>
                <h2 className="text-xl font-bold tracking-tight">{p.title}</h2>
                <p className="text-sm font-medium text-accent">{p.lead}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted leading-relaxed">{p.body}</p>
            <p className="mt-4 border-l-2 border-accent pl-3 text-sm font-medium text-foreground">{p.tag}</p>
          </section>
        ))}
      </div>

      {/* The comparison */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight">An Alchemy key vs. the network</h2>
        <div className="mt-5 overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-faint border-b border-line bg-surface">
                <th className="px-4 py-3">Layer</th>
                <th className="px-4 py-3 text-center">An Alchemy key</th>
                <th className="px-4 py-3 text-center">Visa Wallet Rating</th>
              </tr>
            </thead>
            <tbody>
              {TABLE.map(([layer, alchemy]) => (
                <tr key={layer} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{layer}</td>
                  <td className="px-4 py-3 text-center">
                    {alchemy ? <span style={{ color: "var(--grade-a)" }}>✓</span> : <span className="text-faint">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center" style={{ color: "var(--grade-a)" }}>✓</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-14 rounded-2xl bg-foreground px-6 py-8 sm:px-10 text-background">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">The one-line version</p>
        <p className="mt-3 text-lg sm:text-xl font-semibold leading-relaxed">
          An Alchemy key tells an app what a wallet did on its own turf. Visa Wallet Rating tells every app what a
          wallet did <em>everywhere</em>, who&apos;s really behind it, and — uniquely — whether wallets like it have
          paid back or burned the network before.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3 text-sm">
        <Link href="/network" className="rounded-lg border border-line-strong px-4 py-2.5 font-medium hover:border-accent">
          See the live network →
        </Link>
        <Link href="/whitepaper" className="rounded-lg border border-line-strong px-4 py-2.5 font-medium hover:border-accent">
          Read the whitepaper →
        </Link>
        <Link href="/developers" className="rounded-lg bg-accent px-4 py-2.5 font-semibold text-white hover:bg-accent-strong">
          Integrate the rating →
        </Link>
      </div>
    </div>
  );
}
