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

      {/* Rating passes — each card is a real wallet; click through to its live report */}
      <section className="pb-16 flex flex-col items-center">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 sm:gap-4 w-full">
          {(
            [
              ["A", "+", 935, "Blue Chip", "0x2326d4fb2737666dda96bd6314e3d4418246cfe8"],
              ["B", "+", 784, "Whale", "0x42087c28f296d3b2dab56e3f5d1aca1388f2be5b"],
              ["C", "+", 446, "Explorer", "0x1f62e517b74904fb221c3eec6cec954473a89514"],
              ["F", "", 0, "Sanctioned", "0x0330070fd38ec3bb94f58fa55d40368271e9e54a"],
            ] as const
          ).map(([g, mod, score, label, addr]) => (
            <Link key={g} href={`/wallet/${addr}`} className="flex flex-col items-center gap-2.5 group">
              <GradeCard grade={g} modifier={mod} score={score} address={addr} holder={label} size="sm" />
              <span className="text-sm text-muted font-medium">{label}</span>
              <span className="-mt-1 text-xs text-accent opacity-80 group-hover:opacity-100">
                View a real {g} wallet →
              </span>
            </Link>
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
          { who: "For rated wallets", t: "Mint your pass", d: "Put your rating in your wallet as a living pass that upgrades itself as you transact.", href: "/claim", cta: "Connect & mint" },
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
          Mint your pass
        </Link>
        <p className="mt-3 text-xs text-faint">
          Free for wallet owners. <Link href="/developers" className="underline hover:text-muted">API for apps →</Link>
        </p>
      </section>
    </div>
    </>
  );
}
