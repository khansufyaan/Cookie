import Link from "next/link";
import LookupForm from "@/components/LookupForm";
import { ALL_APPS } from "@/lib/apps";
import { fetchContractCounters } from "@/lib/counters";

export const revalidate = 3600;

export default async function Home() {
  const counters = await fetchContractCounters();
  const liveTx = counters.reduce((s, c) => s + (c.txCount ?? 0), 0);

  return (
    <div className="mx-auto max-w-3xl px-5">
      <section className="pt-28 pb-16 text-center flex flex-col items-center">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
          The credit rating
          <br />
          for wallets.
        </h1>
        <p className="mt-6 text-lg text-muted max-w-md">
          Enter any wallet. Get a rating built from real on-chain history.
        </p>
        <div className="mt-10 w-full flex justify-center">
          <LookupForm />
        </div>
        <p className="mt-4 text-xs text-faint">
          Live Ethereum data · OFAC screened · KYC attestation checked
        </p>
      </section>

      <section className="py-10 border-t border-line text-center">
        <p className="text-sm text-muted">
          <span className="font-semibold text-foreground tabular-nums">{liveTx.toLocaleString()}</span> transactions
          tracked across <span className="font-semibold text-foreground">{ALL_APPS.length}</span> leading apps on{" "}
          <span className="font-semibold text-foreground">2</span> chains.
        </p>
      </section>

      <section className="py-14 grid gap-10 sm:grid-cols-3 text-center border-t border-line">
        {[
          { t: "Rated", d: "A, B, or C — one legible grade from five factors of real activity." },
          { t: "Screened", d: "Every lookup checked against OFAC and for a KYC attestation." },
          { t: "Yours", d: "Claim your score as a soulbound credential. Take it anywhere." },
        ].map((x) => (
          <div key={x.t}>
            <h2 className="font-semibold">{x.t}</h2>
            <p className="mt-2 text-sm text-muted leading-relaxed">{x.d}</p>
          </div>
        ))}
      </section>

      <section className="py-14 border-t border-line text-center">
        <Link
          href="/claim"
          className="inline-block rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-strong transition-colors"
        >
          Claim your score
        </Link>
        <p className="mt-3 text-xs text-faint">
          Free for wallet owners. <Link href="/developers" className="underline hover:text-muted">API for apps →</Link>
        </p>
      </section>
    </div>
  );
}
