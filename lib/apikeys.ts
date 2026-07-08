import { createHash, randomBytes } from "crypto";
import { getPool } from "./db";

/**
 * API keys + usage metering. Keys are shown once and stored as SHA-256
 * hashes. Usage is metered per identifier per UTC day; anonymous callers are
 * metered by hashed IP. Fails OPEN when the database is unreachable — a
 * metering outage must never take the product down.
 */

export const TIER_LIMITS: Record<string, number> = {
  anonymous: 50,
  free: 1_000,
  growth: 25_000,
};

let ready = false;

async function ensureTables(): Promise<boolean> {
  const p = getPool();
  if (!p) return false;
  if (ready) return true;
  await p.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id SERIAL PRIMARY KEY,
      key_hash TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      tier TEXT NOT NULL DEFAULT 'free',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS api_usage (
      identifier TEXT NOT NULL,
      day DATE NOT NULL,
      count INT NOT NULL DEFAULT 0,
      PRIMARY KEY (identifier, day)
    );
  `);
  ready = true;
  return true;
}

function hash(v: string): string {
  return createHash("sha256").update(v).digest("hex");
}

export async function createApiKey(email: string): Promise<{ key: string } | { error: string }> {
  if (!(await ensureTables())) return { error: "Key service temporarily unavailable." };
  const p = getPool()!;
  const key = `hb_live_${randomBytes(24).toString("hex")}`;
  try {
    await p.query(`INSERT INTO api_keys (key_hash, email) VALUES ($1, $2)`, [hash(key), email.toLowerCase()]);
    return { key };
  } catch (err: unknown) {
    if (typeof err === "object" && err && "code" in err && (err as { code: string }).code === "23505") {
      return { error: "A key was already issued for this email. Contact us to rotate it." };
    }
    throw err;
  }
}

export interface MeterResult {
  allowed: boolean;
  tier: string;
  used: number;
  limit: number;
}

/**
 * Identify the caller (API key or hashed IP), increment today's usage, and
 * enforce the tier limit.
 */
export async function meter(req: Request): Promise<MeterResult> {
  const fallback: MeterResult = { allowed: true, tier: "unmetered", used: 0, limit: 0 };
  try {
    if (!(await ensureTables())) return fallback;
    const p = getPool()!;

    const auth = req.headers.get("authorization");
    const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    const queryKey = new URL(req.url).searchParams.get("api_key");
    const rawKey = bearer ?? queryKey;

    let tier = "anonymous";
    let identifier: string;
    if (rawKey && rawKey.startsWith("hb_")) {
      const { rows } = await p.query(`SELECT tier FROM api_keys WHERE key_hash = $1`, [hash(rawKey)]);
      if (rows.length === 0) return { allowed: false, tier: "invalid", used: 0, limit: 0 };
      tier = rows[0].tier;
      identifier = `key:${hash(rawKey).slice(0, 16)}`;
    } else {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      identifier = `ip:${hash(ip).slice(0, 16)}`;
    }

    const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
    const { rows } = await p.query(
      `INSERT INTO api_usage (identifier, day, count) VALUES ($1, CURRENT_DATE, 1)
       ON CONFLICT (identifier, day) DO UPDATE SET count = api_usage.count + 1
       RETURNING count`,
      [identifier],
    );
    const used = rows[0].count as number;
    return { allowed: used <= limit, tier, used, limit };
  } catch (err) {
    console.error("meter failed (failing open):", err);
    return fallback;
  }
}
