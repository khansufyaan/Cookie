import KeyGenerator from "@/components/KeyGenerator";

export const metadata = { title: "Pricing — Visa Wallet Rating" };

const TIERS = [
  {
    name: "Sandbox",
    price: "$0",
    period: "",
    blurb: "Evaluate the rating engine.",
    features: ["1,000 verifications / day", "Full rating + factor breakdown", "Score history + OFAC/KYC flags", "Test seals and badges"],
    highlight: false,
  },
  {
    name: "Commercial",
    price: "$0.002",
    period: "/ verification",
    blurb: "Wallet providers and dApps in production.",
    features: ["Volume tiers, $2,500 / mo minimum", "25,000+ verifications / day", "Deposit + transfer-time screening", "Grade-change webhooks (soon)", "Priority ingest for contributed signals"],
    highlight: true,
  },
  {
    name: "Strategic",
    price: "Custom",
    period: "",
    blurb: "Issuers, exchanges, and networks.",
    features: ["Committed volume + SLA", "Bulk universe export", "Custom factor weighting", "Co-branded rating programs", "MSA + DPA"],
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-16 pb-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
        <p className="mt-3 text-muted">Priced per verification, like the network you already know. Contributing signals is free on every tier.</p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`rounded-2xl border bg-surface p-6 flex flex-col ${t.highlight ? "border-accent shadow-[0_8px_30px_-12px_rgba(29,78,216,0.25)]" : "border-line"}`}
          >
            {t.highlight && <span className="self-start rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">Popular</span>}
            <h2 className={`font-semibold text-lg ${t.highlight ? "mt-3" : ""}`}>{t.name}</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold">{t.price}</span>
              <span className="text-sm text-faint">{t.period}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{t.blurb}</p>
            <ul className="mt-4 space-y-2 text-sm text-muted flex-1">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span style={{ color: "var(--grade-a)" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            {t.name !== "Sandbox" && (
              <a
                href={`mailto:khansufyaan@gmail.com?subject=${encodeURIComponent(`Visa Wallet Rating ${t.name} plan`)}`}
                className={`mt-5 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors ${t.highlight ? "bg-accent text-white hover:bg-accent-strong" : "border border-line-strong hover:border-accent"}`}
              >
                Talk to us
              </a>
            )}
            {t.name === "Sandbox" && <div className="mt-5"><KeyGenerator /></div>}
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-faint">
        Anonymous requests (no key) are limited to 50/day per IP. Self-serve card billing for Growth arrives with the
        next release — early Growth customers are onboarded manually.
      </p>
    </div>
  );
}
