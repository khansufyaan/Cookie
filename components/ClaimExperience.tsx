"use client";

import { useState } from "react";
import type { Grade } from "@/lib/types";
import EmailCapture from "./EmailCapture";
import GradeCard from "./GradeCard";

const EVM_RE = /^0x[0-9a-fA-F]{40}$/;
const SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

interface Preview {
  address: string;
  grade: Grade;
  modifier: string;
  score: number;
  tier: string;
  tokenId: string;
}

/** The live "see your own pass" moment: one prominent input, card on success. */
export default function ClaimExperience() {
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
      // Custodial pools return 200 with grade:null and no sbt — explain
      // why there's no pass instead of crashing on the missing fields.
      if (!json.data?.sbt || json.data.grade == null) {
        setState("error");
        setMessage(
          json.data?.entityType === "custodial_pool"
            ? `This is a known custodial/exchange pool${json.data.label ? ` (${json.data.label})` : ""} — it holds many users' funds, so no individual pass is issued.`
            : "This address isn't eligible for a pass yet.",
        );
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

  if (state === "ready" && preview) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="w-72 sm:w-[340px] max-w-full">
          <GradeCard
            grade={preview.grade}
            modifier={preview.modifier}
            score={preview.score}
            address={preview.address}
            tier={preview.tier}
          />
        </div>
        <h2 className="mt-6 text-2xl font-bold tracking-tight">This one&apos;s yours.</h2>
        <p className="mt-2 text-sm text-muted max-w-sm">
          Pass <span className="font-mono">{preview.tokenId}</span> — live from your real history. Claiming puts it
          in your wallet, sealed to your address. Be first in line:
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
          className="flex-1 rounded-full border border-line-strong bg-surface px-5 py-3.5 font-mono text-sm placeholder:text-faint focus:outline-none focus:border-accent"
          aria-label="Wallet address"
        />
        <button
          type="submit"
          disabled={state === "busy"}
          className="rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white hover:bg-accent-strong transition-colors disabled:opacity-60 whitespace-nowrap"
        >
          {state === "busy" ? "Reading chain…" : "See yours"}
        </button>
      </div>
      {state === "error" && (
        <p className="mt-3 text-sm text-center" style={{ color: "var(--grade-c)" }}>{message}</p>
      )}
    </form>
  );
}
