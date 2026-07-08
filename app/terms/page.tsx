export const metadata = { title: "Terms — Halbrook" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-16 pb-8">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-xs text-faint">Effective July 2026 · Beta service</p>
      <div className="mt-6 space-y-5 text-sm text-muted leading-relaxed">
        <p>
          <strong className="text-foreground">The service.</strong> Halbrook provides informational ratings of
          blockchain wallet addresses computed from public on-chain data, via this website and an API. The service
          is in beta: coverage windows, factor weights, and grade calibrations are documented in the{" "}
          <a href="/methodology" className="text-accent underline">methodology</a> and may change.
        </p>
        <p>
          <strong className="text-foreground">Not financial advice; not a consumer report.</strong> Ratings are
          informational opinions about on-chain activity patterns. They are not financial, investment, or legal
          advice; not a recommendation to transact; and not a consumer report as defined by the Fair Credit
          Reporting Act or similar laws. You may not use Halbrook ratings to determine any individual&apos;s
          eligibility for credit, insurance, employment, or housing.
        </p>
        <p>
          <strong className="text-foreground">Acceptable use.</strong> Respect the rate limits of your tier. No
          scraping beyond the API, no reselling raw ratings without an agreement, no use for unlawful
          discrimination, surveillance of identified individuals, or sanctions evasion.
        </p>
        <p>
          <strong className="text-foreground">Accuracy and disputes.</strong> We compute from sources we document,
          disclose coverage limits on every report, and offer a{" "}
          <a href="/disputes" className="text-accent underline">dispute process</a>. The service is provided as-is
          without warranties; to the maximum extent permitted by law our liability is limited to fees you paid in
          the twelve months preceding a claim.
        </p>
        <p>
          <strong className="text-foreground">API keys.</strong> Keys are personal to the registered email. We may
          revoke keys that violate these terms. Paid tiers are governed additionally by their order form.
        </p>
        <p>
          <strong className="text-foreground">Contact.</strong> khansufyaan@gmail.com.
        </p>
      </div>
    </div>
  );
}
