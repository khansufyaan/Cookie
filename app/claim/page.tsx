import LookupForm from "@/components/LookupForm";

export const metadata = { title: "Claim your score — Halbrook" };

export default function ClaimPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-24 pb-10 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Your score already exists.</h1>
      <p className="mt-2 text-4xl font-bold tracking-tight text-accent">Claim it.</p>
      <p className="mt-6 text-muted leading-relaxed">
        Every rated wallet has a Halbrook Score built from its real on-chain history. Claiming mints it as a
        soulbound credential you own — non-transferable, non-tradeable, portable to a new wallet only by your
        signature.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-3 text-left">
        {[
          { n: "1", t: "Look up", d: "Check your wallet's score — free, no connection needed." },
          { n: "2", t: "Connect & sign", d: "Prove you own the wallet. One signature, no gas." },
          { n: "3", t: "Claim", d: "Your score becomes a soulbound credential on Base." },
        ].map((s) => (
          <div key={s.n} className="rounded-xl border border-line bg-surface p-5">
            <div className="text-xs font-bold text-accent">{s.n}</div>
            <h2 className="mt-1 font-semibold text-sm">{s.t}</h2>
            <p className="mt-1.5 text-xs text-muted leading-relaxed">{s.d}</p>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <button
          disabled
          className="rounded-lg bg-accent/50 px-6 py-3 text-sm font-semibold text-white cursor-not-allowed"
          title="Claiming opens with the attestation launch"
        >
          Claiming opens soon
        </button>
        <p className="mt-3 text-xs text-faint">Check your score now — claiming unlocks in the next release.</p>
      </div>

      <div className="mt-10 flex justify-center">
        <LookupForm compact />
      </div>
    </div>
  );
}
