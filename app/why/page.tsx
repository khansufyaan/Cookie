import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = { title: "Who it's for — Visa Wallet Rating" };

function EyeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" />
      <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
    </svg>
  );
}
function PersonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

const PERSONAS: { icon: ReactNode; persona: string; headline: string; points: string[]; cta: string; href: string }[] = [
  {
    icon: <EyeIcon />,
    persona: "New apps",
    headline: "Understand who just connected.",
    points: ["Instant read on any wallet", "Catch risky or sanctioned addresses", "No history of your own needed"],
    cta: "Read the API docs",
    href: "/developers",
  },
  {
    icon: <ShareIcon />,
    persona: "Established apps",
    headline: "Share data, get ratings free.",
    points: ["Report what you know", "Get every app's signal back — free", "Strengthen the ecosystem"],
    cta: "Start sharing",
    href: "/developers",
  },
  {
    icon: <PersonIcon />,
    persona: "Consumers",
    headline: "Know and grow your score.",
    points: ["See your on-chain reputation", "Learn how to raise it", "Carry it everywhere"],
    cta: "Build your score",
    href: "/claim",
  },
];

export default function WhyPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-16 pb-16">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight">Who it&apos;s for</h1>
        <p className="mt-4 text-lg text-muted leading-relaxed">
          Apps don&apos;t share what they know about a wallet. Visa is the neutral place they can — here&apos;s what
          each side gets.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {PERSONAS.map((p) => (
          <div key={p.persona} className="flex flex-col rounded-2xl border border-line bg-surface p-7">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl text-accent"
              style={{ background: "rgba(20, 52, 203, 0.08)" }}
            >
              {p.icon}
            </div>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">{p.persona}</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">{p.headline}</h2>
            <ul className="mt-5 space-y-3 flex-1">
              {p.points.map((pt) => (
                <li key={pt} className="flex items-start gap-3 text-base text-muted">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {pt}
                </li>
              ))}
            </ul>
            <Link href={p.href} className="mt-6 text-sm font-semibold text-accent hover:text-accent-strong">
              {p.cta} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
