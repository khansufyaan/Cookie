"use client";

import { useState } from "react";
import Link from "next/link";
import type { Grade } from "@/lib/types";
import EmailCapture from "./EmailCapture";
import GradeCard from "./GradeCard";

const EVM_RE = /^0x[0-9a-fA-F]{40}$/;
const SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/* Illustrative personas — sample cards, not live wallets. Each shows what
   kind of history earns which grade and the fastest factor to push next. */
const PERSONAS = [
  {
    id: "power-user",
    name: "The Power User",
    grade: "A" as Grade,
    modifier: "",
    score: 870,
    address: "0x7f3ba28c91d4e05a66f19c8e2b74d0a153c9ef21",
    tagline: "Every month, everywhere.",
    drivers: [
      "Active in 8 of the 10 tracked apps — Reach near its ceiling, plus the +50 Full-Stack bonus.",
      "Transactions in nearly every month for three years — Consistency maxed.",
    ],
    lever: "Already at the top of the scale — keeping the monthly rhythm holds the A.",
  },
  {
    id: "whale",
    name: "The Whale",
    grade: "A" as Grade,
    modifier: "−",
    score: 815,
    address: "0x2ce84b90f16da3341f0c9d7ab52ee08e174ab5d9",
    tagline: "Few transactions, serious size.",
    drivers: [
      "Eight-figure tracked volume — Magnitude at its ceiling despite a modest transaction count.",
      "Large average ticket on an aged wallet — Bedrock does the rest.",
    ],
    lever: "Touching two or three more tracked apps would lift Reach and lock in a flat A.",
  },
  {
    id: "regular",
    name: "The Regular",
    grade: "B" as Grade,
    modifier: "+",
    score: 645,
    address: "0x91af5507c26be4d380e12cf94a70b6a2e8fd03c4",
    tagline: "Steady DeFi, three apps deep.",
    drivers: [
      "Consistent monthly activity on 3 tracked apps — solid Consistency and Usage.",
      "Mid-size volume keeps Magnitude in the middle of its range.",
    ],
    lever: "Reach is the gap: two more tracked apps is worth up to ~40 points and starts the climb to A.",
  },
  {
    id: "newcomer",
    name: "The Newcomer",
    grade: "C" as Grade,
    modifier: "+",
    score: 365,
    address: "0x5db07ee1a4c2f89b30d165a9cc84f01d92be476a",
    tagline: "Three months in, building history.",
    drivers: [
      "Short tenure caps Consistency and Bedrock — most of the gap is simply time.",
      "Two tracked apps so far; every factor still has headroom.",
    ],
    lever: "Stay active each month and add apps — Developing wallets typically reach B within two quarters.",
  },
];

interface Preview {
  address: string;
  grade: Grade;
  modifier: string;
  score: number;
  tier: string;
  tokenId: string;
}

export default function ClaimExperience() {
  const [tab, setTab] = useState<string>("power-user");
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    const addr = value.trim();
    if (!EVM_RE.test(addr) && !SOL_RE.test(addr)) {
      setState("error");
      setMessage("Enter a valid EVM (0x…) or Solana address.");
      return;
    }
    setState("busy");
    try {
      const res = await fetch(`/api/v1/score/${addr}`);
      const json = await res.json();
      if (!res.ok) {
        setState("error");
        setMessage(json.error ?? "Lookup failed — try again.");
        return;
      }
      setPreview({
        address: json.data.address,
        grade: json.data.grade,
        modifier: json.data.modifier,
        score: json.data.score,
        tier: json.data.tier,
        tokenId: json.data.sbt.tokenId,
      });
      setState("ready");
    } catch {
      setState("error");
      setMessage("Network error — try again.");
    }
  }

  const persona = PERSONAS.find((p) => p.id === tab);

  return (
    <div>
      {/* Persona tabs */}
      <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Sample credentials">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={tab === p.id}
            onClick={() => setTab(p.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === p.id
                ? "border-accent bg-accent text-white"
                : "border-line-strong text-muted hover:border-accent hover:text-foreground"
            }`}
          >
            {p.name}
          </button>
        ))}
        <button
          role="tab"
          aria-selected={tab === "you"}
          onClick={() => setTab("you")}
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
            tab === "you"
              ? "border-accent bg-accent text-white"
              : "border-accent text-accent hover:bg-accent hover:text-white"
          }`}
        >
          Your wallet →
        </button>
      </div>

      {/* Persona view */}
      {persona && (
        <div className="mt-8 rounded-2xl border border-line bg-surface p-6 sm:p-8 grid gap-8 md:grid-cols-[auto_1fr] items-center text-left">
          <div className="w-72 sm:w-[340px] max-w-full mx-auto">
            <GradeCard
              grade={persona.grade}
              modifier={persona.modifier}
              score={persona.score}
              address={persona.address}
              holder={persona.name}
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-faint">Sample credential — illustrative</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              {persona.name}. <span className="text-muted font-semibold">{persona.tagline}</span>
            </h2>
            <ul className="mt-4 space-y-2.5">
              {persona.drivers.map((d) => (
                <li key={d} className="flex gap-2.5 text-sm text-muted leading-relaxed">
                  <span className="mt-0.5 text-accent">●</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
              <strong className="text-foreground">Next move:</strong> {persona.lever}{" "}
              <Link href="/methodology#raise" className="text-accent hover:text-accent-strong font-medium whitespace-nowrap">
                How to raise a rating →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Your wallet */}
      {tab === "you" && (
        <div className="mt-8 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          {state === "ready" && preview ? (
            <div className="grid gap-8 md:grid-cols-[auto_1fr] items-center text-left">
              <div className="w-72 sm:w-[340px] max-w-full mx-auto">
                <GradeCard
                  grade={preview.grade}
                  modifier={preview.modifier}
                  score={preview.score}
                  address={preview.address}
                  tier={preview.tier}
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-faint">Live — from real on-chain history</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight">This card is yours.</h2>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  Credential <span className="font-mono">{preview.tokenId}</span> · {preview.tier} tier. Claiming
                  seals it to your wallet as a soulbound credential — be first in line:
                </p>
                <div className="mt-4">
                  <EmailCapture source="claim" cta="Join the waitlist" wallet={preview.address} />
                </div>
                <button
                  onClick={() => { setState("idle"); setValue(""); setPreview(null); }}
                  className="mt-3 text-xs text-faint hover:text-muted"
                >
                  Check a different wallet
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={lookup} className="w-full max-w-xl mx-auto">
              <p className="text-sm text-muted mb-3">
                Enter your address to preview the exact card waiting for your wallet — live, from chain data.
              </p>
              <div className="flex gap-2">
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0x… or Solana wallet address"
                  spellCheck={false}
                  className="flex-1 rounded-lg border border-line-strong bg-surface px-4 py-3 font-mono text-sm placeholder:text-faint focus:outline-none focus:border-accent"
                  aria-label="Wallet address"
                />
                <button
                  type="submit"
                  disabled={state === "busy"}
                  className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-strong transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  {state === "busy" ? "Reading chain…" : "Preview my card"}
                </button>
              </div>
              {state === "error" && (
                <p className="mt-2 text-sm text-center" style={{ color: "var(--grade-c)" }}>{message}</p>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
