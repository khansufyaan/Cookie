import { Pool } from "pg";

/**
 * Postgres (Railway) — used for the email list now; the wallet-universe
 * indexer next. Connections are created lazily so the app runs fine
 * without DATABASE_URL (subscribe endpoints return 503).
 */

let pool: Pool | null = null;

export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
    });
  }
  return pool;
}

let subscribersReady = false;

export async function addSubscriber(email: string, source: string, wallet?: string): Promise<boolean> {
  const p = getPool();
  if (!p) return false;
  if (!subscribersReady) {
    await p.query(`CREATE TABLE IF NOT EXISTS subscribers (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      source TEXT NOT NULL,
      wallet TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (email, source)
    )`);
    subscribersReady = true;
  }
  await p.query(
    `INSERT INTO subscribers (email, source, wallet) VALUES ($1, $2, $3)
     ON CONFLICT (email, source) DO UPDATE SET wallet = COALESCE(EXCLUDED.wallet, subscribers.wallet)`,
    [email.toLowerCase(), source, wallet ?? null],
  );
  return true;
}

let webhooksReady = false;

export const WEBHOOK_EVENTS = ["grade.changed", "sanctions.listed"] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export interface Webhook {
  id: number;
  url: string;
  events: string[];
  secret: string;
}

async function ensureWebhooks(): Promise<boolean> {
  const p = getPool();
  if (!p) return false;
  if (webhooksReady) return true;
  await p.query(`CREATE TABLE IF NOT EXISTS webhooks (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL,
    secret TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  webhooksReady = true;
  return true;
}

export async function registerWebhook(url: string, events: WebhookEvent[], secret: string): Promise<number | null> {
  if (!(await ensureWebhooks())) return null;
  const p = getPool()!;
  const { rows } = await p.query(
    `INSERT INTO webhooks (url, events, secret) VALUES ($1, $2, $3) RETURNING id`,
    [url, events, secret],
  );
  return rows[0].id as number;
}

export async function removeWebhook(id: number, secret: string): Promise<boolean> {
  if (!(await ensureWebhooks())) return false;
  const p = getPool()!;
  const res = await p.query(`UPDATE webhooks SET active = false WHERE id = $1 AND secret = $2 AND active`, [id, secret]);
  return (res.rowCount ?? 0) > 0;
}

export async function webhooksForEvent(event: WebhookEvent): Promise<Webhook[]> {
  if (!(await ensureWebhooks())) return [];
  const p = getPool()!;
  const { rows } = await p.query(`SELECT id, url, events, secret FROM webhooks WHERE active AND $1 = ANY(events) LIMIT 100`, [event]);
  return rows as Webhook[];
}

let mintsReady = false;

/** Records a mint reservation for a connected wallet (one row per wallet). */
export async function reserveMint(wallet: string, grade: string, score: number): Promise<number | null> {
  const p = getPool();
  if (!p) return null;
  if (!mintsReady) {
    await p.query(`CREATE TABLE IF NOT EXISTS mint_reservations (
      wallet TEXT PRIMARY KEY,
      grade TEXT,
      score INT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    mintsReady = true;
  }
  await p.query(
    `INSERT INTO mint_reservations (wallet, grade, score) VALUES ($1, $2, $3)
     ON CONFLICT (wallet) DO UPDATE SET grade = EXCLUDED.grade, score = EXCLUDED.score`,
    [wallet.toLowerCase(), grade, score],
  );
  const { rows } = await p.query(`SELECT count(*)::int AS n FROM mint_reservations`);
  return rows[0].n as number;
}
