import Link from "next/link";
import ActionsTicker from "@/components/ActionsTicker";
import GradeCard from "@/components/GradeCard";
import type { CardGrade } from "@/components/GradeCard";
import LogoMarquee from "@/components/LogoMarquee";
import LookupForm from "@/components/LookupForm";
import { ALL_APPS } from "@/lib/apps";
import { fetchContractCounters } from "@/lib/counters";
import { resolveWalletCached } from "@/lib/wallets";

export const revalidate = 3600;

const SAMPLE_WALLET = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"; // vitalik.eth

// Showcase wallets — real addresses. Grade/score are pulled LIVE from the same
// engine as the report pages (so the home cards never drift from the truth);
// the pinned values are only a fallback if a resolve fails at build time.
const SAMPLES: { addr: string; label: string; grade: CardGrade; modifier: string; score: number }[] = [
  { addr: "0x2326d4fb2737666dda96bd6314e3d4418246cfe8", label: "Blue Chip", grade: "A", modifier: "+", score: 990 },
  { addr: "0x42087c28f296d3b2dab56e3f5d1aca1388f2be5b", label: "Whale", grade: "B", modifier: "+", score: 797 },
  { addr: "0x507e04f5072ff20a3619abca832b02f01567f8de", label: "Regular", grade: "C", modifier: "+", score: 312 },
  { addr: "0x0330070fd38ec3bb94f58fa55d40368271e9e54a", label: "Sanctioned", grade: "F", modifier: "", score: 0 },
];

async function liveSamples() {
  const resolved = await Promise.allSettled(SAMPLES.map((s) => resolveWalletCached(s.addr)));
  return SAMPLES.map((s, i) => {
    const r = resolved[i];
    if (r.status === "fulfilled" && r.value.kind === "ok") {
      const { result } = r.value.report;
      if (result.sanctions.listed) return { ...s, label: "Sanctioned", grade: "F" as CardGrade, modifier: "", score: 0 };
      // Live grade AND live archetype label, so face + label never disagree.
      return { ...s, label: result.archetype || s.label, grade: result.grade as CardGrade, modifier: result.modifier, score: result.score };
    }
    return s; // fall back to the pinned value
  });
}

const INTEGRATIONS = [
  { label: "REST API", href: "/developers" },
  { label: "Webhooks", href: "/developers#webhooks" },
  { label: "MCP server", href: "/developers#mcp" },
  { label: "Data-sharing", href: "/developers" },
];

const DOORS = [
  { who: "For wallet owners", t: "Get rated", d: "Enter any wallet. Instant grade from its real on-chain history — free.", href: "#lookup", cta: "Look up a wallet" },
  { who: "For apps & exchanges", t: "Screen every transfer", d: "Call the API at deposit or send time; get the counterparty grade, KYC and sanctions flags back in one round trip.", href: "/developers", cta: "Read the API docs" },
  { who: "For consumers", t: "Mint your pass", d: "Put your rating in your wallet as a living pass that upgrades itself as you transact.", href: "/claim", cta: "Connect & mint" },
];

export default async function Home() {
  const [counters, samples] = await Promise.all([fetchContractCounters(), liveSamples()]);
  const liveTx = counters.reduce((s, c) => s + (c.txCount ?? 0), 0);

  return (
    <>
    <ActionsTicker />
    <div className="mx-auto max-w-3xl px-5">
      <section id="lookup" className="pt-24 pb-14 text-center flex flex-col items-center scroll-mt-16">
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

      {/* Social proof */}
      <section className="pb-12">
        <LogoMarquee />
        <p className="mt-4 text-center text-sm text-muted">
          <span className="font-semibold text-foreground tabular-nums">{liveTx.toLocaleString()}</span> transactions
          tracked across <span className="font-semibold text-foreground">{ALL_APPS.length}</span> leading apps on{" "}
          <span className="font-semibold text-foreground">2</span> chains.
        </p>
      </section>

      {/* Three doors — the primary way into the site, by who you are */}
      <section className="py-12 grid gap-4 sm:grid-cols-3 border-t border-line">
        {DOORS.map((x) => (
          <Link
            key={x.t}
            href={x.href}
            className="rounded-xl border border-line bg-surface p-6 hover:border-accent transition-colors group"
          >
            <p className="text-base font-extrabold uppercase tracking-[0.12em] text-accent">{x.who}</p>
            <h2 className="mt-2 text-lg font-semibold">{x.t}</h2>
            <p className="mt-2 text-sm text-muted leading-relaxed">{x.d}</p>
            <span className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white group-hover:bg-accent-strong transition-colors">
              {x.cta} →
            </span>
          </Link>
        ))}
      </section>

      {/* Proof — each card is a real wallet, rated live; click through to its report */}
      <section className="py-12 border-t border-line flex flex-col items-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Real wallets, rated live</p>
        <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4 sm:gap-4 w-full">
          {samples.map((s) => (
            <Link key={s.addr} href={`/wallet/${s.addr}`} className="flex flex-col items-center gap-2.5 group">
              <GradeCard grade={s.grade} modifier={s.modifier} score={s.score} address={s.addr} holder={s.label} size="sm" />
              <span className="text-sm text-muted font-medium">{s.label}</span>
              <span className="-mt-1 text-xs text-accent opacity-80 group-hover:opacity-100">
                View a real {s.grade} wallet →
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted max-w-sm text-center">
          One legible grade — built from five factors, screened for sanctions, sealed to the wallet.
        </p>
      </section>

      {/* Integration surface — signals "infrastructure", not "a website" */}
      <section className="py-12 border-t border-line text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">One rating, many ways in</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {INTEGRATIONS.map((i) => (
            <Link
              key={i.label}
              href={i.href}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-strong transition-colors"
            >
              {i.label}
            </Link>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted max-w-md mx-auto">
          Read it over REST, get pushed grade changes, or let an AI agent call it directly.{" "}
          <Link href="/why" className="text-accent underline hover:text-accent-strong">The problem we solve →</Link>
        </p>
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
