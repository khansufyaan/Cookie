import ClaimExperience from "@/components/ClaimExperience";
import PassEvolution from "@/components/PassEvolution";

export const metadata = { title: "Claim your pass — Visa Wallet Rating" };

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

      {/* What claiming actually does for you */}
      <section className="mt-24">
        <h2 className="text-center text-3xl font-bold tracking-tight">What claiming unlocks</h2>

        <div className="mt-10 space-y-4">
          {/* The honest score-increase lever */}
          <div className="rounded-2xl border-2 bg-surface p-6 flex items-center gap-5" style={{ borderColor: "var(--grade-a)" }}>
            <div className="text-4xl font-bold tabular-nums whitespace-nowrap" style={{ color: "var(--grade-a)" }}>+50</div>
            <div>
              <h3 className="font-semibold text-lg">Verify your identity, score goes up</h3>
              <p className="mt-1 text-sm text-muted">
                Add a verified identity as you claim and your score rises +50 — enough to move a tier, into Verified
                or Prime. It&apos;s the one boost that isn&apos;t just waiting for more on-chain activity.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface p-6">
              <h3 className="font-semibold text-lg">It lives in your wallet</h3>
              <p className="mt-1 text-sm text-muted">
                One signature, no gas. The pass sits next to your tokens and goes wherever your wallet goes.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-6">
              <h3 className="font-semibold text-lg">It stays current</h3>
              <p className="mt-1 text-sm text-muted">
                Keeps re-scoring as you transact — the grade on the pass is never stale, and never needs re-issuing.
              </p>
            </div>
          </div>
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
