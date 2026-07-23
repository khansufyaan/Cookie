import Link from "next/link";
import { notFound } from "next/navigation";
import FactorBars from "@/components/FactorBars";
import GradeCard from "@/components/GradeCard";
import LookupForm from "@/components/LookupForm";
import ScoreHistory, { HistoryTable } from "@/components/ScoreHistory";
import AppLogo from "@/components/AppLogo";
import AppCoverage from "@/components/AppCoverage";
import { APP_BY_ID } from "@/lib/apps";
import { resolveWalletCached } from "@/lib/wallets";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GRADE_MEANING: Record<string, string> = {
  A: "Top-decile wallet",
  B: "Established wallet",
  C: "Developing wallet",
};

/** Compact USD, e.g. $113M, $24.1K. */
function usdCompact(n: number): string {
  return `$${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n)}`;
}

export default async function WalletPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const resolution = await resolveWalletCached(decodeURIComponent(address));
  if (resolution.kind === "invalid") notFound();

  if (resolution.kind === "custodial") {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-24 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Custodial pool — not rated</h1>
        <p className="mt-3 text-muted">
          This address is a known omnibus wallet ({resolution.label}). It moves funds on behalf of many customers,
          so a grade here would describe the exchange, not any user. Deposits from it carry no wallet-level signal —
          the API returns an explicit <code className="font-mono text-xs">custodial_pool</code> flag instead.
        </p>
        <div className="mt-8 flex justify-center"><LookupForm compact /></div>
      </div>
    );
  }

  if (resolution.kind === "solana-soon") {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-24 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Solana coverage is coming soon</h1>
        <p className="mt-3 text-muted">
          We detected a Solana address. The Solana indexer (Jupiter, Raydium, Orca, Pump.fun and the rest of the
          top 10) is in progress — we don&apos;t show estimated or synthetic scores.
        </p>
        <div className="mt-8 flex justify-center"><LookupForm compact /></div>
      </div>
    );
  }

  if (resolution.kind === "unavailable") {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-24 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Chain data temporarily unavailable</h1>
        <p className="mt-3 text-muted">
          We couldn&apos;t reach the chain source just now. No cached or estimated score is shown — try again in a
          minute.
        </p>
        <div className="mt-8 flex justify-center"><LookupForm compact /></div>
      </div>
    );
  }

  const { report } = resolution;
  const { result, profile, history } = report;
  const stableMix = report.stableMix.filter((s) => s.usd >= 1);
  const stableTotal = stableMix.reduce((t, s) => t + s.usd, 0);
  // Pseudo-domains resolved by the logo proxy to each coin's official mark
  // (an issuer favicon — Circle, Sky, PayPal — is not the coin's logo).
  const STABLE_DOMAINS: Record<string, string> = {
    USDC: "usdc.token", USDT: "usdt.token", DAI: "dai.token", USDE: "usde.token",
    PYUSD: "pyusd.token", USDS: "usds.token", FDUSD: "fdusd.token",
  };
  const active = profile.activities.filter((a) => a.txCount > 0);
  const usedAppIds = active.map((a) => a.appId);
  const years = (result.totals.walletAgeMonths / 12).toFixed(1);
  const gradeMeaning = result.sanctions.listed
    ? "Restricted — do not serve"
    : GRADE_MEANING[result.grade];
  const pills: { text: string; good?: boolean }[] = [
    { text: result.archetype },
    { text: `${result.totals.appsUsed}/10 apps` },
    ...(result.totals.volumeUsd > 0 ? [{ text: usdCompact(result.totals.volumeUsd) }] : []),
    { text: `${years}y history` },
    result.kyc.verified ? { text: "ID verified", good: true } : { text: "No ID check" },
  ];

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

      {result.sanctions.listed && (
        <div className="mt-3 rounded-lg border px-4 py-3 text-sm font-medium" style={{ borderColor: "var(--grade-c)", color: "var(--grade-c)", background: "var(--surface)" }}>
          ⚠ This address appears on the {result.sanctions.list} snapshot. Rating suppressed; tier Restricted.
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[auto_1fr] items-start">
        <div className="rounded-xl border border-line bg-surface p-6 flex flex-col items-center text-center lg:w-96">
          <GradeCard
            /* Sanctioned wallets carry the F strike, not a letter grade. */
            grade={result.sanctions.listed ? "F" : result.grade}
            modifier={result.sanctions.listed ? "" : result.modifier}
            score={result.score}
            address={result.address}
            /* Show the tier only when it's a signal (Prime/Verified/Restricted);
               otherwise the characterful archetype reads better than "Standard". */
            holder={
              result.sanctions.listed
                ? "Sanctioned"
                : result.tier === "Standard"
                  ? result.archetype
                  : `${result.tier} tier`
            }
          />
          <div className="mt-5 text-sm font-semibold">{gradeMeaning}</div>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {pills.map((p) => (
              <span
                key={p.text}
                className="rounded-full border px-2.5 py-1 text-xs font-medium"
                style={
                  p.good
                    ? { borderColor: "var(--grade-a)", color: "var(--grade-a)" }
                    : { borderColor: "var(--border-strong)", color: "var(--muted)" }
                }
              >
                {p.text}
              </span>
            ))}
          </div>
          {!result.sanctions.listed && (
            <Link
              href="/claim"
              className="mt-5 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-strong transition-colors"
            >
              Mint your pass
            </Link>
          )}
        </div>

        {/* Chart beside the seal when there's a timeline; factors otherwise */}
        {history.length >= 2 ? (
          <ScoreHistory history={history} showTable={false} />
        ) : (
          <div className="rounded-xl border border-line bg-surface p-6">
            <h2 className="font-semibold">Wallet Rating Score breakdown</h2>
            <p className="mt-1 text-xs text-faint">
              Five factors, weighted into a 0–1000 score.{" "}
              <Link href="/methodology" className="text-accent hover:text-accent-strong">How scoring works →</Link>
            </p>
            <div className="mt-5">
              <FactorBars factors={result.factors} />
            </div>
          </div>
        )}
      </div>

      {/* "Active on" — app logos, sorted by activity (directly under the chart) */}
      {active.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold tracking-tight">Active on</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {[...active]
              .sort((a, b) => b.txCount - a.txCount)
              .map((a) => {
                const app = APP_BY_ID.get(a.appId);
                return (
                  <div key={a.appId} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
                    {app && <AppLogo domain={app.domain} name={app.name} size={32} />}
                    <div>
                      <div className="font-semibold text-sm">{app?.name ?? a.appId}</div>
                      <div className="text-xs text-faint tabular-nums">
                        {a.txCount.toLocaleString()} tx
                        {a.volumeUsd > 0 && ` · $${Math.round(a.volumeUsd).toLocaleString()}`}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* Stablecoin usage — per-asset outgoing volume */}
      {stableMix.length > 0 && stableTotal > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">Stablecoin usage</h2>
          <p className="mt-1 text-xs text-faint">
            Outgoing stablecoin volume by asset, across tracked activity.
          </p>
          <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full">
            {stableMix.map((s, i) => (
              <div
                key={s.asset}
                title={`${s.asset} — $${Math.round(s.usd).toLocaleString()}`}
                style={{
                  width: `${(s.usd / stableTotal) * 100}%`,
                  background: `var(--accent)`,
                  opacity: 1 - i * (0.6 / Math.max(stableMix.length, 1)),
                }}
              />
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stableMix.map((s) => (
              <div key={s.asset} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
                {STABLE_DOMAINS[s.asset] && <AppLogo domain={STABLE_DOMAINS[s.asset]} name={s.asset} size={28} />}
                <div className="min-w-0">
                  <div className="font-semibold text-sm">{s.asset}</div>
                  <div className="text-xs text-faint tabular-nums">
                    ${Math.round(s.usd).toLocaleString()} · {Math.round((s.usd / stableTotal) * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gamified coverage + milestone boosts */}
      {!result.sanctions.listed && <AppCoverage result={result} usedAppIds={usedAppIds} />}

      {/* Score breakdown under the chart */}
      {history.length >= 2 && (
        <div className="mt-10 rounded-xl border border-line bg-surface p-6">
          <h2 className="font-semibold">Wallet Rating Score breakdown</h2>
          <p className="mt-1 text-xs text-faint">
            Five factors, weighted into a 0–1000 score.{" "}
            <Link href="/methodology" className="text-accent hover:text-accent-strong">How scoring works →</Link>
          </p>
          <div className="mt-5 grid gap-x-10 md:grid-cols-2 md:[&>*]:min-w-0">
            <FactorBars factors={result.factors.slice(0, 3)} />
            <FactorBars factors={result.factors.slice(3)} />
          </div>
        </div>
      )}

      {/* Compliance panel */}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {result.kyc.verified && result.kyc.source.includes("Coinbase") && (
                <AppLogo domain="coinbase.com" name="Coinbase" size={20} />
              )}
              <h3 className="font-semibold text-sm">Identity (KYC)</h3>
            </div>
            <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold"
              style={{ borderColor: result.kyc.verified ? "var(--grade-a)" : "var(--border-strong)", color: result.kyc.verified ? "var(--grade-a)" : "var(--faint)" }}>
              {result.kyc.verified ? "✓ Verified" : "Unverified"}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted">{result.kyc.source}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Sanctions screening</h3>
            <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold"
              style={{ borderColor: result.sanctions.listed ? "var(--grade-c)" : "var(--grade-a)", color: result.sanctions.listed ? "var(--grade-c)" : "var(--grade-a)" }}>
              {result.sanctions.listed ? "⚠ Listed" : "✓ Clear"}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Screened against {result.sanctions.checkedAgainst} entries · {result.sanctions.list}
          </p>
        </div>
      </div>

      {/* Month-by-month table */}
      {history.length >= 2 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">Monthly record</h2>
          <div className="mt-4">
            <HistoryTable history={history} />
          </div>
        </section>
      )}

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
                    No interactions with the tracked app set — this is the real, verified on-chain answer.
                  </td>
                </tr>
              )}
              {active.map((a) => {
                const app = APP_BY_ID.get(a.appId);
                return (
                <tr key={a.appId} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5 font-medium">
                      {app && <AppLogo domain={app.domain} name={app.name} size={22} />}
                      {app?.name ?? a.appId}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{a.txCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums">${a.volumeUsd.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted tabular-nums">{a.firstTx}</td>
                  <td className="px-4 py-3 text-muted tabular-nums">{a.lastTx}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Embeddable seal */}
      {!result.sanctions.listed && (
        <section className="mt-10 rounded-xl border border-line bg-surface p-6">
          <div className="flex flex-wrap items-center gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/v1/badge/${result.address}`} alt={`Visa Wallet Rating grade ${result.grade}${result.modifier} seal`} width={100} height={100} />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">Embed this seal</h3>
              <p className="mt-1 text-sm text-muted">
                Show your rating anywhere — profiles, docs, dApp frontends. The seal updates automatically as the
                rating changes.
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-surface-2 p-3 text-xs font-mono text-muted">
                {`<a href="https://visa-wallet-rating.vercel.app/wallet/${result.address}">\n  <img src="https://visa-wallet-rating.vercel.app/api/v1/badge/${result.address}" width="120" />\n</a>`}
              </pre>
            </div>
          </div>
        </section>
      )}

      {/* Attestation + portability */}
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-6">
          <h3 className="font-semibold">Soulbound attestation</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-faint">Status</dt>
              <dd className="font-medium">{result.sbt.minted ? "Eligible to claim" : "Not eligible yet"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-faint">Credential ID</dt>
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
            Sign a message from both wallets to migrate your reputation. Visa Wallet Rating revokes the attestation on this
            wallet and re-issues it on the destination — one live attestation per identity, ever.
          </p>
          <button disabled className="mt-4 rounded-lg border border-line-strong px-4 py-2 text-sm text-faint cursor-not-allowed">
            Opens with claiming
          </button>
        </div>
      </section>
    </div>
  );
}
