"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const EVM_RE = /^0x[0-9a-fA-F]{40}$/;
const SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export default function LookupForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const addr = value.trim();
    if (EVM_RE.test(addr)) {
      setError("");
      router.push(`/wallet/${addr.toLowerCase()}`);
    } else if (SOL_RE.test(addr)) {
      setError("");
      router.push(`/wallet/${addr}`);
    } else {
      setError("Enter a valid EVM (0x…) or Solana (base58) address.");
    }
  }

  return (
    <form onSubmit={submit} className={compact ? "w-full max-w-md" : "w-full max-w-xl"}>
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
          className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-background hover:bg-accent-strong transition-colors"
        >
          Rate it
        </button>
      </div>
      {error && <p className="mt-2 text-sm" style={{ color: "var(--grade-c)" }}>{error}</p>}
    </form>
  );
}
