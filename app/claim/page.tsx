import ClaimExperience from "@/components/ClaimExperience";
import PassEvolution from "@/components/PassEvolution";

export const metadata = { title: "Claim your pass — Visa Wallet Rating" };

export default function ClaimPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-20 pb-10">
      {/* Hero: what the pass is + the same pass evolving over time */}
      <div className="grid gap-10 lg:grid-cols-2 items-center">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl font-bold tracking-tight">Your rating lives in your wallet.</h1>
          <p className="mt-2 text-4xl font-bold tracking-tight text-accent">Claim your pass.</p>
          <p className="mt-6 text-muted leading-relaxed max-w-lg mx-auto lg:mx-0">
            Nothing is shipped and there&apos;s no plastic — the pass is a digital collectible that sits inside
            your crypto wallet next to your tokens, like a boarding pass in Apple Wallet. It&apos;s sealed to your
            address, so only you can hold it.
          </p>
          <p className="mt-4 text-muted leading-relaxed max-w-lg mx-auto lg:mx-0">
            And it&apos;s alive: as you transact, the same pass re-scores itself and upgrades. The one on the right
            is a single wallet&apos;s pass replayed over two years — C to A without ever being reissued.
          </p>
        </div>
        <PassEvolution />
      </div>

      {/* Sample personas + live preview */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Whose pass would yours look like?</h2>
        <p className="mt-2 text-muted text-sm max-w-lg mx-auto">
          Browse the sample passes, then preview the real one waiting for your wallet.
        </p>
        <div className="mt-8">
          <ClaimExperience />
        </div>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-3 text-left">
        {[
          { n: "1", t: "Preview", d: "See your live score and the pass ID reserved for your wallet." },
          { n: "2", t: "Connect & sign", d: "Prove ownership with one signature. No gas — we sponsor the mint." },
          { n: "3", t: "Claim", d: "The pass appears in your wallet on Base and keeps updating itself as you transact." },
        ].map((s) => (
          <div key={s.n} className="rounded-xl border border-line bg-surface p-5">
            <div className="text-xs font-bold text-accent">{s.n}</div>
            <h2 className="mt-1 font-semibold text-sm">{s.t}</h2>
            <p className="mt-1.5 text-xs text-muted leading-relaxed">{s.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
