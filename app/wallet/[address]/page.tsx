import Link from "next/link";
import { notFound } from "next/navigation";
import FactorBars from "@/components/FactorBars";
import LookupForm from "@/components/LookupForm";
import ScoreRing from "@/components/ScoreRing";
import { APP_BY_ID } from "@/lib/apps";
import { resolveWallet } from "@/lib/wallets";

export const dynamic = "force-dynamic";

const TIER_STYLE: Record<string, { color: string; blurb: string }> = {
  Prime: { color: "var(--grade-a)", blurb: "KYC-verified identity + grade A activity — the top of the network." },
  Verified: { color: "var(--accent)", blurb: "KYC-verified identity attestation on this wallet." },
  Standard: { color: "var(--muted)", blurb: "No identity attestation — rated on activity alone." },
  Restricted: { color: "var(--grade-c)", blurb: "OFAC sanctions match. Do not serve this wallet." },
};

export default async function WalletPage({
  params,
  searchParams,
}: {
  params: Promise<{ address: string }>;
  searchParams: Promise<{ demo?: string }>;
}) {
  const { address } = await params;
  const { demo } = await searchParams;
  const report = await resolveWallet(decodeURIComponent(address), { forceDemo: demo === "1" });
  if (!report) notFound();

  const { result, profile, dataSource, liveNote } = report;
  const active = profile.activities.filter((a) => a.txCount > 0);
  const tierStyle = TIER_STYLE[result.tier];

  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-faint">
            Wallet report · {result.family === "evm" ? "Ethereum" : "Solana"}
          </p>
          <h1 className="mt-1 font-mono text-sm sm:text-base break-all">{result.address}</h1>
        </div>
        <LookupForm compact />
      </div>

      {/* Data source banner */}
      <div
        className="mt-5 rounded-lg border px-4 py-3 text-sm"
        style={{
          borderColor: dataSource === "live" ? "var(--grade-a)" : "var(--grade-b)",
          background: "var(--surface)",
        }}
      >
        <span className="font-semibold" style={{ color: dataSource === "live" ? "var(--grade-a)" : "var(--grade-b)" }}>
          {dataSource === "live" ? "● Live data" : "○ Demo data"}
        </span>
        <span className="ml-2 text-muted">{liveNote}</span>
      </div>

      {/* Sanctions banner */}
      {result.sanctions.listed && (
        <div className="mt-3 rounded-lg border px-4 py-3 text-sm font-medium" style={{ borderColor: "var(--grade-c)", color: "var(--grade-c)", background: "var(--surface)" }}>
          ⚠ This address appears on the {result.sanctions.list} snapshot. Rating suppressed; tier Restricted.
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[auto_1fr]">
        {/* Score card */}
        <div className="rounded-xl border border-line bg-surface p-8 flex flex-col items-center text-center lg:w-80">
          <ScoreRing score={result.score} grade={result.grade} modifier={result.modifier} />
          <div
            className="mt-4 rounded-full border px-3 py-1 text-xs font-semibold"
            style={{ borderColor: tierStyle.color, color: tierStyle.color }}
          >
            {result.tier} tier
          </div>
          <div className="mt-3 rounded-full border border-line-strong px-3 py-1 text-xs font-medium text-accent">
            {result.archetype}
          </div>
          <p className="mt-2 text-xs text-muted max-w-[16rem]">{result.archetypeNote}</p>
          {result.fullStackBonus > 0 && (
            <p className="mt-3 text-xs font-medium" style={{ color: "var(--grade-a)" }}>
              ✓ Full-Stack bonus +{result.fullStackBonus} — active in {result.totals.appsUsed} tracked apps
            </p>
          )}
          {result.kycBonus > 0 && (
            <p className="mt-1 text-xs font-medium" style={{ color: "var(--grade-a)" }}>
              ✓ KYC bonus +{result.kycBonus}
            </p>
          )}
        </div>

        {/* Factors */}
        <div className="rounded-xl border border-line bg-surface p-6">
          <h2 className="font-semibold">CRUMB factor breakdown</h2>
          <p className="mt-1 text-xs text-faint">
            Five factors, weighted into a 0–1000 score.{" "}
            <Link href="/methodology" className="text-accent hover:text-accent-strong">
              How scoring works →
            </Link>
          </p>
          <div className="mt-5">
            <FactorBars factors={result.factors} />
          </div>
        </div>
      </div>

      {/* Compliance panel */}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Identity (KYC)</h3>
            <span
              className="rounded-full border px-2.5 py-0.5 text-xs font-semibold"
              style={{
                borderColor: result.kyc.verified ? "var(--grade-a)" : "var(--border-strong)",
                color: result.kyc.verified ? "var(--grade-a)" : "var(--faint)",
              }}
            >
              {result.kyc.verified ? "✓ Verified" : "Unverified"}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted">{result.kyc.source}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Sanctions screening</h3>
            <span
              className="rounded-full border px-2.5 py-0.5 text-xs font-semibold"
              style={{
                borderColor: result.sanctions.listed ? "var(--grade-c)" : "var(--grade-a)",
                color: result.sanctions.listed ? "var(--grade-c)" : "var(--grade-a)",
              }}
            >
              {result.sanctions.listed ? "⚠ Listed" : "✓ Clear"}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Screened against {result.sanctions.checkedAgainst} entries · {result.sanctions.list}
          </p>
        </div>
      </div>

      {/* Totals */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Tracked transactions", value: result.totals.txCount.toLocaleString() },
          { label: "Tracked volume", value: `$${Math.round(result.totals.volumeUsd).toLocaleString()}` },
          { label: "Apps used", value: `${result.totals.appsUsed} / 10` },
          { label: "History age", value: `${result.totals.walletAgeMonths} mo` },
          { label: "Active months", value: String(result.totals.activeMonths) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-surface p-4">
            <div className="text-lg font-bold tabular-nums">{s.value}</div>
            <div className="mt-0.5 text-xs text-faint">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Per-app activity */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">Activity by tracked app</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-faint border-b border-line bg-surface">
                <th className="px-4 py-3">App</th>
                <th className="px-4 py-3 text-right">Transactions</th>
                <th className="px-4 py-3 text-right">Volume (USD)</th>
                <th className="px-4 py-3">First tx</th>
                <th className="px-4 py-3">Last tx</th>
              </tr>
            </thead>
            <tbody>
              {active.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted">
                    No interactions with the tracked app set{dataSource === "live" ? " in the scanned window — this is your real, verified on-chain answer" : ""}.
                  </td>
                </tr>
              )}
              {active.map((a) => (
                <tr key={a.appId} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{APP_BY_ID.get(a.appId)?.name ?? a.appId}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{a.txCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums">${a.volumeUsd.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted tabular-nums">{a.firstTx}</td>
                  <td className="px-4 py-3 text-muted tabular-nums">{a.lastTx}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SBT + portability */}
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-6">
          <h3 className="font-semibold">Soulbound attestation</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-faint">Status</dt>
              <dd className="font-medium">{result.sbt.minted ? "Eligible to claim" : "Not eligible yet"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-faint">Token ID</dt>
              <dd className="font-mono">{result.sbt.tokenId}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-faint">Standard</dt>
              <dd>{result.sbt.standard}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-faint">{result.sbt.note}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-6">
          <h3 className="font-semibold">Port this score to another wallet</h3>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            Sign a message from both wallets to migrate your reputation. Cookie revokes the attestation on this
            wallet and re-issues it on the destination — one live attestation per identity, ever. Both addresses
            are recorded in the migration log to keep sybil analysis intact.
          </p>
          <button
            disabled
            className="mt-4 rounded-lg border border-line-strong px-4 py-2 text-sm text-faint cursor-not-allowed"
            title="Requires wallet connection — not enabled in the demo"
          >
            Connect wallet to port (disabled in demo)
          </button>
        </div>
      </section>
    </div>
  );
}
