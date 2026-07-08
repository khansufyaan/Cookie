"use client";

import { useState } from "react";
import EmailCapture from "./EmailCapture";

const EVM_RE = /^0x[0-9a-fA-F]{40}$/;
const SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const GRADE_COLORS: Record<string, string> = { A: "var(--grade-a)", B: "var(--grade-b)", C: "var(--grade-c)" };

interface Preview {
  address: string;
  grade: string;
  score: number;
  tier: string;
  tokenId: string;
}

/** Look up your wallet, see the credential you'd claim, join the waitlist. */
export default function ClaimPreview() {
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
        grade: `${json.data.grade}${json.data.modifier}`,
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

  if (state === "ready" && preview) {
    const color = GRADE_COLORS[preview.grade[0]];
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 flex flex-col items-center">
        <div
          className="flex h-36 w-36 flex-col items-center justify-center rounded-2xl border-[3px] bg-surface select-none"
          style={{ borderColor: color, boxShadow: "0 1px 3px rgba(16,24,40,0.08)" }}
        >
          <span className="text-[9px] font-semibold uppercase tracking-[0.28em]" style={{ color: "var(--faint)" }}>Visa Wallet Rating</span>
          <span className="text-6xl font-bold leading-none my-1" style={{ color }}>{preview.grade}</span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.28em]" style={{ color: "var(--faint)" }}>Rated</span>
        </div>
        <p className="mt-5 font-mono text-xs text-faint break-all text-center">{preview.address}</p>
        <p className="mt-2 text-2xl font-bold tabular-nums">{preview.score}<span className="text-sm font-normal text-faint"> / 1000</span></p>
        <p className="mt-1 text-sm text-muted">
          Credential <span className="font-mono">{preview.tokenId}</span> · {preview.tier} tier
        </p>
        <p className="mt-6 text-sm font-medium text-foreground">This credential is yours. Be first to claim it:</p>
        <div className="mt-3 w-full flex justify-center">
          <EmailCapture source="claim" cta="Join the waitlist" wallet={preview.address} />
        </div>
        <button onClick={() => { setState("idle"); setValue(""); setPreview(null); }} className="mt-4 text-xs text-faint hover:text-muted">
          Check a different wallet
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={lookup} className="w-full max-w-xl mx-auto">
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
          {state === "busy" ? "Reading chain…" : "Preview my credential"}
        </button>
      </div>
      {state === "error" && <p className="mt-2 text-sm text-center" style={{ color: "var(--grade-c)" }}>{message}</p>}
    </form>
  );
}
