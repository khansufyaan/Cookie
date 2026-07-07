import Link from "next/link";
import GradeChip from "@/components/GradeChip";
import LookupForm from "@/components/LookupForm";
import { EVM_APPS, SOL_APPS } from "@/lib/apps";
import { FEATURED_WALLETS, demoRate, networkStats } from "@/lib/wallets";

export default function Home() {
  const stats = networkStats();
  const featured = FEATURED_WALLETS.map((f) => ({ ...f, result: demoRate(f.address, "evm") }));

  return (
    <div className="mx-auto max-w-6xl px-5">
      {/* Hero */}
      <section className="pt-20 pb-12 text-center flex flex-col items-center">
        <p className="text-xs uppercase tracking-[0.25em] text-accent mb-4">The credit score for crypto wallets</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl">
          Every wallet has a reputation. Cookie makes it legible.
        </h1>
        <p className="mt-5 max-w-xl text-muted">
          Cookie rates wallets <strong className="text-foreground">A, B, or C</strong> from activity across the top
          10 apps on Ethereum and Solana — plus KYC attestation and OFAC screening. Apps use it to know their best
          users. Users own it and take it anywhere.
        </p>
        <div className="mt-8 w-full flex justify-center">
          <LookupForm />
        </div>
        <p className="mt-3 text-xs text-faint">
          Ethereum lookups read <strong className="text-muted">live mainnet data</strong>. Solana is demo tier until
          the indexer connects. Every lookup is screened against the OFAC SDN snapshot.
        </p>
      </section>

      {/* Featured example wallets */}
      <section>
        <p className="text-xs uppercase tracking-widest text-faint mb-3">Example profiles (synthetic)</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map(({ label, address, result }) => (
            <Link
              key={address}
              href={`/wallet/${address}?demo=1`}
              className="rounded-xl border border-line bg-surface p-4 hover:border-accent transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                <GradeChip grade={result.grade} modifier={result.modifier} />
              </div>
              <p className="mt-2 font-mono text-xs text-faint truncate">{address}</p>
              <p className="mt-1 text-xs text-muted tabular-nums">
                {result.score} pts · {result.totals.appsUsed}/10 apps
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats strip */}
      <section className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Wallets rated (demo population)", value: stats.population.toLocaleString() },
          { label: "KYC-verified wallets", value: stats.kycWallets.toLocaleString() },
          { label: "Tracked apps · 2 chains", value: String(EVM_APPS.length + SOL_APPS.length) },
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
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            {
              t: "1 · Index",
              d: "We read wallet history against the top-10 apps by volume on Ethereum and Solana, and partner apps push activity through the ingest API.",
            },
            {
              t: "2 · Screen",
              d: "Every wallet is checked against the OFAC SDN list and for a KYC identity attestation (Coinbase Verifications via EAS).",
            },
            {
              t: "3 · Rate",
              d: "The CRUMB engine scores 0–1000 across five factors. Whales and power users both have a path to grade A. KYC adds a bonus and unlocks the Prime tier.",
            },
            {
              t: "4 · Attest",
              d: "The rating becomes a soulbound attestation the owner claims and controls — portable via signed revoke-and-reissue migration.",
            },
          ].map((s) => (
            <div key={s.t} className="rounded-xl border border-line bg-surface p-5">
              <div className="text-sm font-semibold text-accent">{s.t}</div>
              <p className="mt-2 text-sm text-muted leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust tiers */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight">Trust tiers</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            { t: "Prime", c: "var(--grade-a)", d: "KYC-verified + grade A. The best-rated wallets on the network." },
            { t: "Verified", c: "var(--accent)", d: "KYC attestation present; any grade." },
            { t: "Standard", c: "var(--muted)", d: "Rated on activity alone — no identity attestation." },
            { t: "Restricted", c: "var(--grade-c)", d: "OFAC sanctions match. Rating suppressed; do not serve." },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-line bg-surface p-5">
              <div className="text-sm font-bold" style={{ color: x.c }}>{x.t}</div>
              <p className="mt-2 text-xs text-muted leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Launch apps */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight">Tracked app set — top 10 by volume, per chain</h2>
        <p className="mt-2 text-sm text-muted max-w-2xl">
          The rating universe is bootstrapped from wallets interacting with these contracts and programs. The set is
          recalibrated quarterly by volume.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {[
            { title: "Ethereum + EVM", apps: EVM_APPS },
            { title: "Solana", apps: SOL_APPS },
          ].map(({ title, apps }) => (
            <div key={title} className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-faint border-b border-line bg-surface">
                    <th className="px-4 py-3">{title}</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Contract / Program</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => (
                    <tr key={a.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-2.5 font-medium whitespace-nowrap">{a.name}</td>
                      <td className="px-4 py-2.5 text-muted whitespace-nowrap">{a.category}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-faint truncate max-w-[12rem]" title={a.contract}>
                        {a.contract.slice(0, 10)}…{a.contract.slice(-6)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>

      {/* Two-sided pitch */}
      <section className="mt-16 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-6">
          <h3 className="font-semibold text-lg">For apps</h3>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            Push your users&apos; activity, get back tiered A/B/C ratings with KYC and sanctions flags. Segment your
            best users, filter sybils before an airdrop, screen OFAC risk at the edge.
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
