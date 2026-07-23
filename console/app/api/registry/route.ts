import { NextResponse } from "next/server";
import { ensureConsoleTables, getPool } from "@/lib/db";
import { BUILTIN_CONTRACTS } from "@/lib/registry";

export const dynamic = "force-dynamic";

/** GET — full monitored-contract registry (built-in + admin-added).
 *  POST {label, chain, address, kind, addedBy} — admin adds a contract,
 *  Visa-internal app endpoint, or HSM wallet to monitoring. */
export async function GET() {
  try {
    const p = getPool();
    if (!p) throw new Error("no database");
    await ensureConsoleTables();
    const { rows } = await p.query(
      `SELECT id, label, chain, address, kind, added_by, status, created_at
       FROM console_contracts ORDER BY id DESC`,
    );
    return NextResponse.json({ data: { builtin: BUILTIN_CONTRACTS, custom: rows }, meta: { source: "live" } });
  } catch {
    return NextResponse.json({ data: { builtin: BUILTIN_CONTRACTS, custom: [] }, meta: { source: "demo" } });
  }
}

const EVM = /^0x[a-fA-F0-9]{40}$/;
const SOL = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const KINDS = new Set(["public-app", "visa-internal", "hsm-wallet"]);

export async function POST(req: Request) {
  let body: { label?: string; chain?: string; address?: string; kind?: string; addedBy?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const label = body.label?.trim();
  const chain = body.chain?.trim() || "Ethereum";
  const address = body.address?.trim() ?? "";
  const kind = KINDS.has(body.kind ?? "") ? body.kind! : "visa-internal";
  if (!label || label.length > 120) return NextResponse.json({ error: "Provide a label (max 120 chars)." }, { status: 400 });
  if (!EVM.test(address) && !SOL.test(address)) {
    return NextResponse.json({ error: "Address must be a valid EVM (0x…) or Solana address." }, { status: 400 });
  }

  try {
    const p = getPool();
    if (!p) throw new Error("no database");
    await ensureConsoleTables();
    const { rows } = await p.query(
      `INSERT INTO console_contracts (label, chain, address, kind, added_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (chain, address) DO UPDATE SET label = EXCLUDED.label, kind = EXCLUDED.kind
       RETURNING id, label, chain, address, kind, status`,
      [label, chain, EVM.test(address) ? address.toLowerCase() : address, kind, (body.addedBy ?? "").slice(0, 60)],
    );
    // HSM wallets are addresses that transact — queue them for rating too.
    if (kind === "hsm-wallet" && EVM.test(address)) {
      await p.query(
        `INSERT INTO wallets (address, family, discovered_via, status)
         VALUES ($1, 'evm', 'visa-console-registry', 'pending')
         ON CONFLICT (address) DO NOTHING`,
        [address.toLowerCase()],
      );
    }
    return NextResponse.json({
      data: rows[0],
      meta: { note: "Queued for indexer onboarding — wallets interacting with this entry point will be discovered on the next crawl cycle." },
    });
  } catch (err) {
    console.error("registry add failed:", err);
    return NextResponse.json({ error: "Database unreachable — add from the deployed console." }, { status: 503 });
  }
}
