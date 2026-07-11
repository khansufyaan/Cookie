"use client";

import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import type { Grade } from "@/lib/types";
import GradeCard from "./GradeCard";

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const EVM_RE = /^0x[0-9a-fA-F]{40}$/;
const SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

interface Pass {
  address: string;
  grade: Grade;
  modifier: string;
  score: number;
  tier: string;
  tokenId: string;
}

async function fetchPass(addr: string): Promise<Pass | { error: string }> {
  try {
    const res = await fetch(`/api/v1/score/${addr}`);
    const json = await res.json();
    if (!res.ok) return { error: json.error ?? "Lookup failed." };
    if (!json.data?.sbt || json.data.grade == null) {
      return { error: json.data?.entityType === "custodial_pool" ? "That's a custodial pool — no personal pass." : "Not eligible yet." };
    }
    return {
      address: json.data.address, grade: json.data.grade, modifier: json.data.modifier,
      score: json.data.score, tier: json.data.tier, tokenId: json.data.sbt.tokenId,
    };
  } catch {
    return { error: "Network error — try again." };
  }
}

function DisconnectButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-5 py-2.5 text-sm font-medium text-muted hover:border-accent hover:text-foreground transition-colors"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
      {label}
    </button>
  );
}

function MintInner() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets[0]?.address;

  const [pass, setPass] = useState<Pass | null>(null);
  const [msg, setMsg] = useState("");
  const [phase, setPhase] = useState<"idle" | "loading" | "minting" | "minted">("idle");

  // Preview-any-address mode (no connect required)
  const [typed, setTyped] = useState("");

  // When a wallet connects, load its pass automatically.
  useEffect(() => {
    if (!authenticated || !wallet) { setPass(null); return; }
    setPhase("loading"); setMsg("");
    fetchPass(wallet).then((r) => {
      if ("error" in r) { setMsg(r.error); setPass(null); }
      else setPass(r);
      setPhase("idle");
    });
  }, [authenticated, wallet]);

  async function previewTyped(e: React.FormEvent) {
    e.preventDefault();
    const addr = typed.trim();
    if (!EVM_RE.test(addr) && !SOL_RE.test(addr)) { setMsg("Enter a valid EVM or Solana address."); return; }
    setPhase("loading"); setMsg("");
    const r = await fetchPass(addr);
    if ("error" in r) { setMsg(r.error); setPass(null); } else setPass(r);
    setPhase("idle");
  }

  async function mint() {
    if (!wallet) return;
    setPhase("minting"); setMsg("");
    try {
      const res = await fetch("/api/v1/claim", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      const json = await res.json();
      if (!res.ok) { setMsg(json.error ?? "Mint failed."); setPhase("idle"); return; }
      setPhase("minted");
    } catch {
      setMsg("Network error — try again."); setPhase("idle");
    }
  }

  function disconnect() {
    logout();
    setPhase("idle");
    setPass(null);
    setMsg("");
  }

  // Connected (or just minted): full-screen takeover — nothing but YOUR card.
  if (authenticated && wallet) {
    const minted = phase === "minted";
    return (
      <div className="fixed inset-0 z-40 bg-background flex flex-col items-center justify-center overflow-hidden px-5">
        {phase === "loading" && <div className="text-sm text-faint">Reading your wallet…</div>}

        {pass && (
          <>
            <div className="relative w-full max-w-[640px]">
              {minted && <div className="card-glow" />}
              <div className={minted ? "card-birth" : ""}>
                <GradeCard
                  grade={pass.grade}
                  modifier={pass.modifier}
                  score={pass.score}
                  address={pass.address}
                  tier={pass.tier}
                  size="lg"
                  className="mx-auto shadow-2xl"
                />
              </div>
            </div>

            {minted ? (
              <div className="rise-in flex flex-col items-center text-center">
                <div className="mt-8 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: "var(--grade-a)" }}>
                  ✓ Yours — reserved
                </div>
                <p className="mt-4 text-sm text-muted max-w-md">
                  Pass <span className="font-mono">{pass.tokenId}</span> is sealed to this wallet. It appears in
                  your wallet when it issues on-chain on Base at launch — gas on us, nothing else to do.
                </p>
                <div className="mt-6">
                  <DisconnectButton onClick={disconnect} label="Disconnect" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <p className="mt-8 text-lg font-semibold">
                  This is your pass.
                </p>
                <button
                  onClick={mint}
                  disabled={phase === "minting"}
                  className="mt-4 rounded-full bg-accent px-10 py-4 text-lg font-semibold text-white hover:bg-accent-strong transition-colors disabled:opacity-60"
                >
                  {phase === "minting" ? "Minting…" : "Mint it — free"}
                </button>
                <p className="mt-2.5 text-xs text-faint">Minted to this wallet · gas sponsored · soulbound</p>
                <div className="mt-6">
                  <DisconnectButton onClick={disconnect} label={`${wallet.slice(0, 6)}…${wallet.slice(-4)} · disconnect`} />
                </div>
              </div>
            )}
          </>
        )}

        {!pass && phase !== "loading" && (
          <div className="flex flex-col items-center text-center">
            {msg && <p className="text-sm" style={{ color: "var(--grade-c)" }}>{msg}</p>}
            <div className="mt-6">
              <DisconnectButton onClick={disconnect} label="Disconnect" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Not connected (also the view while Privy is still initializing)
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={login}
        disabled={!ready}
        className="rounded-full bg-accent px-8 py-3.5 text-base font-semibold text-white hover:bg-accent-strong transition-colors disabled:opacity-60"
      >
        {ready ? "Connect your wallet" : "Starting wallet…"}
      </button>
      <p className="mt-2 text-xs text-faint">
        MetaMask, Coinbase, Phantom &amp; more · you sign to prove it&apos;s yours · gas on us
      </p>

      <form onSubmit={previewTyped} className="mt-6 w-full max-w-md">
        <p className="text-center text-xs text-faint mb-2">Just looking? Preview any wallet</p>
        <div className="flex gap-2">
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="0x… or Solana address"
            spellCheck={false}
            className="flex-1 rounded-full border border-line-strong bg-surface px-4 py-2.5 font-mono text-xs placeholder:text-faint focus:outline-none focus:border-accent"
            aria-label="Wallet address"
          />
          <button type="submit" className="rounded-full border border-line-strong px-4 py-2.5 text-xs font-semibold hover:border-accent">
            Preview
          </button>
        </div>
      </form>

      {phase === "loading" && <div className="mt-4 text-sm text-faint">Reading chain…</div>}
      {pass && (
        <div className="mt-6 w-72 sm:w-[340px] max-w-full">
          <GradeCard grade={pass.grade} modifier={pass.modifier} score={pass.score} address={pass.address} tier={pass.tier} />
          <p className="mt-3 text-center text-xs text-muted">Connect this wallet to mint it.</p>
        </div>
      )}
      {msg && <p className="mt-3 text-sm text-center" style={{ color: "var(--grade-c)" }}>{msg}</p>}
    </div>
  );
}

/** Isolated Privy boundary — only /claim loads the wallet SDK. */
export default function MintPass() {
  if (!APP_ID) {
    return (
      <p className="text-center text-sm text-faint">
        Wallet minting is warming up. Check back shortly.
      </p>
    );
  }
  return (
    <PrivyProvider
      appId={APP_ID}
      config={{
        // External wallets only: the pass must mint to the wallet that EARNED
        // the score. Never create an embedded wallet (it would have 0 history).
        loginMethods: ["wallet"],
        embeddedWallets: {
          ethereum: { createOnLogin: "off" },
          solana: { createOnLogin: "off" },
        },
        appearance: {
          theme: "light",
          accentColor: "#1434CB",
          walletChainType: "ethereum-and-solana",
          showWalletLoginFirst: true,
        },
      }}
    >
      <MintInner />
    </PrivyProvider>
  );
}
