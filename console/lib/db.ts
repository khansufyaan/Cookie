import { Pool } from "pg";

/** Shared Railway Postgres — same database the public product's indexer
 *  writes to. The console reads ratings and manages its own watchlists. */

let pool: Pool | null = null;

export function getPool(): Pool | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!pool) {
    pool = new Pool({ connectionString: url, max: 5, connectionTimeoutMillis: 8000 });
    pool.on("error", (err) => console.error("pg pool error:", err.message));
  }
  return pool;
}

let ready = false;

export async function ensureConsoleTables(): Promise<boolean> {
  const p = getPool();
  if (!p) return false;
  if (ready) return true;
  await p.query(`
    CREATE TABLE IF NOT EXISTS console_watchlists (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS console_watchlist_wallets (
      watchlist_id INT NOT NULL REFERENCES console_watchlists(id) ON DELETE CASCADE,
      address TEXT NOT NULL,
      added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (watchlist_id, address)
    );
    CREATE TABLE IF NOT EXISTS console_models (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      levers JSONB NOT NULL,
      actor TEXT NOT NULL DEFAULT '',
      version INT NOT NULL DEFAULT 1,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS console_model_audit (
      id SERIAL PRIMARY KEY,
      model_name TEXT NOT NULL,
      version INT NOT NULL,
      actor TEXT NOT NULL DEFAULT '',
      levers JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  ready = true;
  return true;
}
