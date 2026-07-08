import EmailCapture from "@/components/EmailCapture";
import { fetchContractCounters } from "@/lib/counters";

export const metadata = { title: "Research — Halbrook" };
export const revalidate = 86400;

export default async function ResearchPage() {
  const counters = await fetchContractCounters();
  const liveTotal = counters.reduce((s, c) => s + (c.txCount ?? 0), 0);

  return (
    <div className="mx-auto max-w-2xl px-5 pt-20 text-center">
      <p className="text-xs uppercase tracking-[0.25em] text-accent">Halbrook Research</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">State of Wallet Credit</h1>
      <p className="mt-2 text-muted">Quarterly · Q3 2026 edition</p>

      <p className="mt-8 text-muted leading-relaxed">
        Grade distributions across active wallets, cross-app behavior patterns, KYC adoption, sanctions exposure,
        and rating-action statistics — built from live chain data covering{" "}
        <strong className="text-foreground tabular-nums">{liveTotal.toLocaleString()}</strong> transactions across
        20 leading apps on Ethereum and Solana.
      </p>

      <div className="mt-10 flex flex-col items-center gap-3">
        <EmailCapture source="research" cta="Get the report" />
        <p className="text-xs text-faint">Delivered by email when the quarterly publishes. No spam, one report per quarter.</p>
      </div>
    </div>
  );
}
