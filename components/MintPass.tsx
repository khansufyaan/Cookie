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

/* Confetti burst — 140 pieces in brand colors, trajectories via CSS vars. */
const CONFETTI_COLORS = ["#1434CB", "#5EE39A", "#FFC24B", "#d9b04c", "#ffffff", "#8fa3ff"];
function Confetti() {
  const pieces = Array.from({ length: 140 }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 480;
    return {
      id: i,
      tx: `${Math.cos(angle) * dist}px`,
      ty: `${Math.sin(angle) * dist * 0.6 + 260 + Math.random() * 240}px`,
      rot: `${(Math.random() - 0.5) * 1080}deg`,
      dur: `${1.4 + Math.random() * 1.4}s`,
      delay: `${Math.random() * 0.35}s`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 10,
    };
  });
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            "--tx": p.tx, "--ty": p.ty, "--rot": p.rot, "--dur": p.dur, "--delay": p.delay,
            background: p.color, width: p.w, height: p.h,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2 text-left hover:border-accent transition-colors"
      title="Copy"
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-faint whitespace-nowrap">{label}</span>
      <span className="font-mono text-xs truncate">{value}</span>
      <span className="text-xs text-accent whitespace-nowrap">{copied ? "✓ copied" : "copy"}</span>
    </button>
  );
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
  const [onchain, setOnchain] = useState<{
    chain: string; contract: string; tokenId: string; explorerTx: string | null; alreadyMinted: boolean;
  } | null>(null);

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
      setOnchain(json.data.onchain ?? null);
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
    setOnchain(null);
  }

  // Connected (or just minted): full-screen takeover — nothing but YOUR card.
  if (authenticated && wallet) {
    const minted = phase === "minted";
    return (
      <div className="fixed inset-0 z-40 bg-background flex flex-col items-center justify-center overflow-y-auto px-5 py-8">
        {phase === "loading" && <div className="text-sm text-faint">Reading your wallet…</div>}

        {minted && <Confetti />}
        {pass && (
          <>
            {/* Big and grand before minting; compact after so the success
                panel fits one screen with no scrolling. */}
            <div className={`relative w-full ${minted ? "max-w-[360px]" : "max-w-[560px]"} shrink-0`}>
              {minted && <div className="card-glow" />}
              <div className={`relative ${minted ? "card-birth" : ""}`}>
                <GradeCard
                  grade={pass.grade}
                  modifier={pass.modifier}
                  score={pass.score}
                  address={pass.address}
                  tier={pass.tier}
                  size={minted ? "md" : "lg"}
                  className="mx-auto shadow-2xl"
                />
                {minted && <div className="card-shine" />}
              </div>
            </div>

            {minted ? (
              <div className="rise-in flex flex-col items-center text-center">
                <div className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: "var(--grade-a)" }}>
                  {onchain ? `✓ Minted on ${onchain.chain}` : "✓ Yours — reserved"}
                </div>

                {onchain ? (
                  <>
                    <p className="mt-3 text-sm text-muted max-w-md">
                      {onchain.alreadyMinted
                        ? "This wallet already holds its pass — soulbound, one per wallet."
                        : "Your pass is on-chain, sealed to this wallet forever. Gas was on us."}
                    </p>
                    {onchain.explorerTx && (
                      <a
                        href={onchain.explorerTx}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block rounded-full border border-line-strong px-5 py-2 text-sm font-medium text-accent hover:border-accent"
                      >
                        View the transaction ↗
                      </a>
                    )}
                    <div className="mt-5 w-full max-w-md rounded-2xl border border-line bg-surface p-4 text-left">
                      <p className="text-xs font-semibold uppercase tracking-widest text-faint text-center">
                        See it in your wallet
                      </p>
                      <p className="mt-2 text-sm text-muted text-center">
                        Most wallets (Coinbase Wallet, Rainbow, Phantom) show it automatically on{" "}
                        <strong>{onchain.chain}</strong> within a few minutes.
                      </p>
                      <p className="mt-3 text-sm font-medium">If yours needs a manual import (e.g. MetaMask):</p>
                      <ol className="mt-2 space-y-2 text-sm">
                        <li className="flex items-center gap-2.5">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">1</span>
                          Switch network to <strong>{onchain.chain}</strong>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">2</span>
                          <span>Open <strong>NFTs</strong> → <strong>Import NFT</strong></span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">3</span>
                          Paste these two:
                        </li>
                      </ol>
                      <div className="mt-2 space-y-1.5">
                        <CopyField label="Contract" value={onchain.contract} />
                        <CopyField label="Token ID" value={onchain.tokenId} />
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-muted max-w-md">
                    Pass <span className="font-mono">{pass.tokenId}</span> is sealed to this wallet. It appears in
                    your wallet when it issues on-chain on Base at launch — gas on us, nothing else to do.
                  </p>
                )}

                <div className="mt-5">
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
