import Link from "next/link";
import GradeChip from "@/components/GradeChip";
import LookupForm from "@/components/LookupForm";
import { TOP_APPS } from "@/lib/apps";
import { FEATURED_WALLETS, lookupWallet, networkStats } from "@/lib/wallets";

export default function Home() {
  const stats = networkStats();
  const featured = FEATURED_WALLETS.map((f) => ({ ...f, result: lookupWallet(f.address) }));

  return (
    <div className="mx-auto max-w-6xl px-5">
      {/* Hero */}
      <section className="pt-20 pb-12 text-center flex flex-col items-center">
        <p className="text-xs uppercase tracking-[0.25em] text-accent mb-4">The credit score for crypto wallets</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl">
          Every wallet has a reputation. Cookie makes it legible.
        </h1>
        <p className="mt-5 max-w-xl text-muted">
          Cookie rates wallets <strong className="text-foreground">A, B, or C</strong> from their activity across the
          top apps on-chain — frequency, volume, breadth, tenure, consistency. Apps use it to know their best users.
          Users own it and take it anywhere.
        </p>
        <div className="mt-8 w-full flex justify-center">
          <LookupForm />
        </div>
        <p className="mt-3 text-xs text-faint">
          Demo tier: any address returns a synthesized profile. Try one of the examples below.
        </p>
      </section>

      {/* Featured example wallets */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map(({ label, address, result }) => (
          <Link
            key={address}
            href={`/wallet/${address}`}
            className="rounded-xl border border-line bg-surface p-4 hover:border-accent transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{label}</span>
              <GradeChip grade={result.grade} modifier={result.modifier} />
            </div>
            <p className="mt-2 font-mono text-xs text-faint truncate">{address}</p>
            <p className="mt-1 text-xs text-muted tabular-nums">
              {result.score} pts · {result.totals.appsUsed}/{TOP_APPS.length} apps
            </p>
          </Link>
        ))}
      </section>

      {/* Stats strip */}
      <section className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Wallets rated", value: stats.population.toLocaleString() },
          { label: "Transactions indexed", value: stats.totalTx.toLocaleString() },
          { label: "Volume tracked", value: `$${(stats.totalVolumeUsd / 1e9).toFixed(1)}B` },
          { label: "Median score", value: String(stats.medianScore) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-surface p-4">
            <div className="text-2xl font-bold tabular-nums">{s.value}</div>
            <div className="mt-1 text-xs text-faint">{s.label}</div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight">How Cookie works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              t: "1 · Index",
              d: `We index every wallet that touches the ${TOP_APPS.length} launch apps — ${TOP_APPS.map((a) => a.name).join(", ")} — and partner apps push activity through the ingest API.`,
            },
            {
              t: "2 · Rate",
              d: "The CRUMB engine scores each wallet 0–1000 across five factors. Whales and power users both have a path to grade A — volume and frequency are weighted equally.",
            },
            {
              t: "3 · Attest",
              d: "The rating is written as a soulbound attestation the wallet owner claims and controls. Non-transferable, non-tradeable — but portable to a new wallet through a signed migration.",
            },
          ].map((s) => (
            <div key={s.t} className="rounded-xl border border-line bg-surface p-5">
              <div className="text-sm font-semibold text-accent">{s.t}</div>
              <p className="mt-2 text-sm text-muted leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Launch apps */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight">Launch app set</h2>
        <p className="mt-2 text-sm text-muted max-w-2xl">
          The initial rating universe is bootstrapped from wallets interacting with these contracts.
        </p>
        <div className="mt-5 overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-faint border-b border-line bg-surface">
                <th className="px-4 py-3">App</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Primary contract</th>
                <th className="px-4 py-3">Chain</th>
              </tr>
            </thead>
            <tbody>
              {TOP_APPS.map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3 text-muted">{a.category}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{a.contract}</td>
                  <td className="px-4 py-3 text-muted">{a.chain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Two-sided pitch */}
      <section className="mt-16 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-6">
          <h3 className="font-semibold text-lg">For apps</h3>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            Push your users&apos; activity, get back A/B/C ratings enriched with cross-app history. Segment your
            best users, filter sybils before an airdrop, underwrite reputation-based perks.
          </p>
          <Link href="/developers" className="mt-4 inline-block text-sm font-medium text-accent hover:text-accent-strong">
            Read the API docs →
          </Link>
        </div>
        <div className="rounded-xl border border-line bg-surface p-6">
          <h3 className="font-semibold text-lg">For wallet owners</h3>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            Check your score, see exactly which factors drive it, and claim it as a soulbound attestation. Moving
            wallets? Port your reputation with a signed migration — the old attestation is revoked, not duplicated.
          </p>
          <Link href="/methodology" className="mt-4 inline-block text-sm font-medium text-accent hover:text-accent-strong">
            See the rating rubric →
          </Link>
        </div>
      </section>
    </div>
  );
}
