import Link from "next/link";
import ActionsTicker from "@/components/ActionsTicker";
import GradeCard from "@/components/GradeCard";
import LogoMarquee from "@/components/LogoMarquee";
import LookupForm from "@/components/LookupForm";
import { ALL_APPS } from "@/lib/apps";
import { fetchContractCounters } from "@/lib/counters";

export const revalidate = 3600;

const SAMPLE_WALLET = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"; // vitalik.eth

export default async function Home() {
  const counters = await fetchContractCounters();
  const liveTx = counters.reduce((s, c) => s + (c.txCount ?? 0), 0);

  return (
    <>
    <ActionsTicker />
    <div className="mx-auto max-w-3xl px-5">
      <section className="pt-24 pb-16 text-center flex flex-col items-center">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
          The credit rating
          <br />
          for wallets.
        </h1>
        <p className="mt-6 text-lg text-muted max-w-md">
          Know the wallet behind every transaction.
        </p>
        <div className="mt-10 w-full flex justify-center">
          <LookupForm />
        </div>
        <p className="mt-4 text-xs text-faint">
          <Link href={`/wallet/${SAMPLE_WALLET}`} className="underline hover:text-muted">
            See a live sample — vitalik.eth
          </Link>
        </p>
      </section>

      {/* Tracked apps */}
      <section className="pb-16">
        <LogoMarquee />
        <p className="mt-4 text-center text-sm text-muted">
          <span className="font-semibold text-foreground tabular-nums">{liveTx.toLocaleString()}</span> transactions
          tracked across <span className="font-semibold text-foreground">{ALL_APPS.length}</span> leading apps on{" "}
          <span className="font-semibold text-foreground">2</span> chains.
        </p>
      </section>

      {/* Rating passes */}
      <section className="pb-16 flex flex-col items-center">
        <div className="grid gap-6 sm:grid-cols-3 sm:gap-5 w-full max-w-2xl">
          {(
            [
              ["A", "", 870, "Top decile", "0x7f3ba28c91d4e05a66f19c8e2b74d0a153c9ef21"],
              ["B", "+", 645, "Established", "0x91af5507c26be4d380e12cf94a70b6a2e8fd03c4"],
              ["C", "+", 365, "Developing", "0x5db07ee1a4c2f89b30d165a9cc84f01d92be476a"],
            ] as const
          ).map(([g, mod, score, label, addr]) => (
            <div key={g} className="flex flex-col items-center gap-3">
              <GradeCard grade={g} modifier={mod} score={score} address={addr} holder={label} size="sm" />
              <span className="text-sm text-muted font-medium">{label}</span>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted max-w-sm text-center">
          One legible grade — built from five factors, screened for sanctions, sealed to the wallet.
        </p>
      </section>

      <section className="py-14 grid gap-4 sm:grid-cols-3 border-t border-line">
        {[
          { who: "For wallet owners", t: "Get rated", d: "Enter any wallet. Instant grade from its real on-chain history — free.", href: "/", cta: "Look up a wallet" },
          { who: "For apps & exchanges", t: "Screen every transfer", d: "Call the API at deposit or send time; get the counterparty grade, KYC and sanctions flags back in one round trip.", href: "/developers", cta: "Read the API docs" },
          { who: "For rated wallets", t: "Claim your pass", d: "Put your rating in your wallet as a living pass that upgrades itself as you transact.", href: "/claim", cta: "Preview your pass" },
        ].map((x) => (
          <Link
            key={x.t}
            href={x.href}
            className="rounded-xl border border-line bg-surface p-6 hover:border-accent transition-colors group"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">{x.who}</p>
            <h2 className="mt-2 font-semibold">{x.t}</h2>
            <p className="mt-2 text-sm text-muted leading-relaxed">{x.d}</p>
            <span className="mt-3 inline-block text-sm font-medium text-accent group-hover:text-accent-strong">
              {x.cta} →
            </span>
          </Link>
        ))}
      </section>

      <section className="py-14 border-t border-line text-center">
        <Link
          href="/claim"
          className="inline-block rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-strong transition-colors"
        >
          Claim your pass
        </Link>
        <p className="mt-3 text-xs text-faint">
          Free for wallet owners. <Link href="/developers" className="underline hover:text-muted">API for apps →</Link>
        </p>
      </section>
    </div>
    </>
  );
}
