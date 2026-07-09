import ClaimExperience from "@/components/ClaimExperience";
import GradeCard from "@/components/GradeCard";
import PassEvolution from "@/components/PassEvolution";

export const metadata = { title: "Claim your pass — Visa Wallet Rating" };

/* Sample passes — real grade shapes, illustrative numbers. One line each. */
const SAMPLES = [
  { name: "The Power User", grade: "A" as const, modifier: "", score: 870, address: "0x7f3ba28c91d4e05a66f19c8e2b74d0a153c9ef21", line: "Every month, everywhere." },
  { name: "The Whale", grade: "A" as const, modifier: "−", score: 815, address: "0x2ce84b90f16da3341f0c9d7ab52ee08e174ab5d9", line: "Few transactions, serious size." },
  { name: "The Regular", grade: "B" as const, modifier: "+", score: 645, address: "0x91af5507c26be4d380e12cf94a70b6a2e8fd03c4", line: "Steady, three apps deep." },
  { name: "The Newcomer", grade: "C" as const, modifier: "+", score: 365, address: "0x5db07ee1a4c2f89b30d165a9cc84f01d92be476a", line: "Three months in, climbing." },
];

export default function ClaimPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pt-20 pb-10">
      {/* One idea, one hero: the living pass. */}
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">Your rating, in your wallet.</h1>
        <p className="mt-4 text-lg text-muted max-w-md mx-auto">
          A pass that lives next to your tokens — and upgrades itself as you transact.
        </p>
      </div>

      <div className="mt-12 flex justify-center">
        <PassEvolution />
      </div>

      {/* The one action: see yours. Always visible, nothing to switch. */}
      <div className="mt-14">
        <ClaimExperience />
        <p className="mt-3 text-center text-xs text-faint">
          Live from real chain data · free · nothing is minted until you claim
        </p>
      </div>

      {/* Sample gallery — show, don't switch */}
      <section className="mt-20">
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-faint">Sample passes</h2>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
          {SAMPLES.map((s) => (
            <div key={s.name} className="flex flex-col items-center text-center gap-2">
              <GradeCard grade={s.grade} modifier={s.modifier} score={s.score} address={s.address} holder={s.name} size="sm" />
              <div className="text-sm font-semibold">{s.name}</div>
              <div className="-mt-1.5 text-xs text-faint">{s.line}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How claiming works — three beats, few words */}
      <section className="mt-16 grid gap-6 sm:grid-cols-3 text-center">
        {[
          { n: "1", t: "Preview", d: "See your live score and reserved pass." },
          { n: "2", t: "Sign", d: "One signature proves it's your wallet. No gas." },
          { n: "3", t: "Done", d: "The pass sits in your wallet and updates itself." },
        ].map((s) => (
          <div key={s.n}>
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">{s.n}</div>
            <h2 className="mt-3 font-semibold">{s.t}</h2>
            <p className="mt-1 text-sm text-muted">{s.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
