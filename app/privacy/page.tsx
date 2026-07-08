export const metadata = { title: "Privacy — Halbrook" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-16 pb-8">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-xs text-faint">Effective July 2026</p>
      <div className="mt-6 space-y-5 text-sm text-muted leading-relaxed">
        <p>
          <strong className="text-foreground">What we process.</strong> Halbrook computes wallet ratings from
          public blockchain data — transactions, timestamps, and counterparty contracts that are permanently
          published on Ethereum and Solana by their networks. We do not collect this data from you; we read it from
          the chains, the same way any block explorer does.
        </p>
        <p>
          <strong className="text-foreground">What you give us.</strong> If you join the research list, the claim
          waitlist, or request an API key, we store your email address, the purpose you gave it for, and — if you
          attach one — a wallet address. We use it only for that purpose: sending the report, opening claiming,
          servicing your API key. We do not sell or share it.
        </p>
        <p>
          <strong className="text-foreground">API usage.</strong> To enforce rate limits we store a one-way hash of
          your IP address or API key together with a daily request count. Raw IP addresses are not retained.
        </p>
        <p>
          <strong className="text-foreground">Analytics.</strong> We use privacy-friendly, cookie-less page
          analytics (Vercel Analytics) to understand aggregate usage. No advertising trackers.
        </p>
        <p>
          <strong className="text-foreground">Your rights.</strong> Email us to access, correct, or delete anything
          you gave us — we action requests within 30 days. Ratings derived from public chain data can be contested
          through the <a href="/disputes" className="text-accent underline">dispute process</a>; note that the
          underlying blockchain records are public and outside anyone&apos;s ability to erase.
        </p>
        <p>
          <strong className="text-foreground">Contact.</strong> khansufyaan@gmail.com (interim address while our
          domain is established).
        </p>
      </div>
    </div>
  );
}
