import ClaimPreview from "@/components/ClaimPreview";

export const metadata = { title: "Claim your score — Visa Wallet Rating" };

export default function ClaimPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-20 pb-10 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Your score already exists.</h1>
      <p className="mt-2 text-4xl font-bold tracking-tight text-accent">Claim it.</p>
      <p className="mt-6 text-muted leading-relaxed max-w-lg mx-auto">
        Every rated wallet has a Visa Wallet Rating credential waiting — built from its real history, soulbound to the wallet,
        portable only by your signature. See yours now; claiming opens with the attestation launch.
      </p>

      <div className="mt-10">
        <ClaimPreview />
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-3 text-left">
        {[
          { n: "1", t: "Preview", d: "See your live score and the credential ID reserved for your wallet." },
          { n: "2", t: "Connect & sign", d: "Prove ownership with one signature. No gas — we sponsor the mint." },
          { n: "3", t: "Claim", d: "Your score becomes a soulbound credential on Base, refreshed as you transact." },
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
