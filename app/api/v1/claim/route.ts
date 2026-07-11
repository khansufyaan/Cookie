import { NextResponse } from "next/server";
import { reserveMint } from "@/lib/db";
import { mintPassOnChain, PASS_CHAIN, passChainConfigured } from "@/lib/passchain";
import { detectFamily, resolveWallet } from "@/lib/wallets";

export const maxDuration = 60;

/**
 * POST /api/v1/claim — reserve a mint for a connected wallet.
 *
 * The wallet address comes from a Privy-authenticated session on the client;
 * we re-resolve its rating server-side (never trust a client-supplied grade)
 * and record the reservation. The actual on-chain mint of the soulbound
 * credential lands when the issuer contract + gas relayer go live; this
 * reserves the holder's place and captures the verified wallet.
 */
export async function POST(req: Request) {
  let body: { wallet?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const wallet = body.wallet?.trim() ?? "";
  if (!detectFamily(wallet)) {
    return NextResponse.json({ error: "Connect a valid EVM or Solana wallet." }, { status: 400 });
  }

  const resolution = await resolveWallet(wallet);
  if (resolution.kind === "custodial") {
    return NextResponse.json({ error: "Custodial pools can't hold a personal pass." }, { status: 400 });
  }
  if (resolution.kind !== "ok") {
    return NextResponse.json({ error: "Couldn't read this wallet's rating right now." }, { status: 503 });
  }
  const { result } = resolution.report;
  if (result.sanctions.listed) {
    return NextResponse.json({ error: "This wallet is sanctioned and cannot mint." }, { status: 403 });
  }

  await reserveMint(wallet, `${result.grade}${result.modifier}`, result.score);

  // Real on-chain mint when the contract + relayer are configured.
  // EVM wallets only — the demo contract lives on Base Sepolia.
  if (passChainConfigured() && result.family === "evm") {
    try {
      const minted = await mintPassOnChain(
        result.address as `0x${string}`,
        `${result.grade}${result.modifier}`,
        result.score,
      );
      return NextResponse.json({
        data: {
          reserved: true,
          minted: true,
          wallet: result.address,
          grade: `${result.grade}${result.modifier}`,
          score: result.score,
          tokenId: result.sbt.tokenId,
          onchain: {
            chain: PASS_CHAIN.name,
            contract: minted.contract,
            tokenId: minted.tokenId,
            txHash: minted.txHash,
            explorerTx: minted.explorerTx,
            alreadyMinted: minted.alreadyMinted,
          },
        },
        meta: { note: "Soulbound pass minted on-chain — gas sponsored by the relayer." },
      });
    } catch (err) {
      console.error("on-chain mint failed (reservation kept):", err);
      // fall through to reservation-only response
    }
  }

  return NextResponse.json({
    data: {
      reserved: true,
      minted: false,
      wallet: result.address,
      grade: `${result.grade}${result.modifier}`,
      score: result.score,
      tokenId: result.sbt.tokenId,
    },
    meta: {
      note: "Mint reserved. The soulbound credential is issued on Base at launch — gas sponsored, no action needed from you.",
    },
  });
}
