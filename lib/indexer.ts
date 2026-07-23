import { EVM_APPS } from "./apps";
import { getPool } from "./db";
import { deliverWebhooks } from "./webhooks";
import { resolveWallet } from "./wallets";

/**
 * The wallet-universe indexer. Runs on Vercel (cron + manual kicks), stores
 * to Railway Postgres.
 *
 *   Discovery — pages through every transfer INTO each tracked Ethereum
 *   contract (Alchemy, oldest-first, cursor per contract) and records each
 *   sending wallet once.
 *   Rating — takes pending wallets and rates them with the same live engine
 *   the site uses, persisting score + history.
 *
 * Each step is sized to fit one serverless invocation; the cron makes it a
 * continuous background process.
 */

const DISCOVERY_PAGES_PER_RUN = 2; // 2 x 1000 transfers per invocation
const RATE_BATCH = 4;

let schemaReady = false;

export async function initSchema(): Promise<boolean> {
  const p = getPool();
  if (!p) return false;
  if (schemaReady) return true;
  await p.query(`
    CREATE TABLE IF NOT EXISTS wallets (
      address TEXT PRIMARY KEY,
      family TEXT NOT NULL DEFAULT 'evm',
      discovered_via TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS wallets_status_idx ON wallets (status);
    CREATE TABLE IF NOT EXISTS ratings (
      address TEXT PRIMARY KEY REFERENCES wallets(address),
      family TEXT NOT NULL,
      score INT NOT NULL,
      grade TEXT NOT NULL,
      modifier TEXT NOT NULL DEFAULT '',
      tier TEXT NOT NULL,
      archetype TEXT,
      tx_count INT NOT NULL,
      volume_usd BIGINT NOT NULL,
      apps_used INT NOT NULL,
      kyc_verified BOOLEAN NOT NULL DEFAULT false,
      sanctioned BOOLEAN NOT NULL DEFAULT false,
      history JSONB,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS index_cursors (
      contract TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      page_key TEXT,
      done BOOLEAN NOT NULL DEFAULT false,
      transfers_seen BIGINT NOT NULL DEFAULT 0,
      last_run TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  // Seed one cursor per Ethereum entry-point contract.
  for (const app of EVM_APPS.filter((a) => a.chain === "Ethereum")) {
    await p.query(
      `INSERT INTO index_cursors (contract, app_id) VALUES ($1, $2) ON CONFLICT (contract) DO NOTHING`,
      [app.contract.toLowerCase(), app.id],
    );
  }
  schemaReady = true;
  return true;
}

interface AlchemyTransferPage {
  result?: { transfers?: { from: string }[]; pageKey?: string };
  error?: { message: string };
}

async function fetchTransferPage(contract: string, pageKey: string | null): Promise<AlchemyTransferPage> {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) throw new Error("ALCHEMY_API_KEY missing");
  const res = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${key}`, {
    method: "POST",
    signal: AbortSignal.timeout(15000),
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "alchemy_getAssetTransfers",
      params: [
        {
          toAddress: contract,
          category: ["external", "erc20"],
          order: "asc",
          maxCount: "0x3e8",
          excludeZeroValue: false,
          ...(pageKey ? { pageKey } : {}),
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`alchemy ${res.status}`);
  return (await res.json()) as AlchemyTransferPage;
}

export interface DiscoveryResult {
  appId: string;
  transfersScanned: number;
  walletsInserted: number;
  cursorDone: boolean;
}

/** One discovery slice: advance the least-recently-run open cursor. */
export async function discoverStep(): Promise<DiscoveryResult | null> {
  const p = getPool();
  if (!p) return null;
  // Atomically claim the least-recently-run open cursor: the FOR UPDATE
  // SKIP LOCKED subquery runs inside this single UPDATE's implicit transaction,
  // so two overlapping invocations claim different cursors (bumping last_run)
  // instead of both fetching the same pages.
  const { rows } = await p.query(
    `UPDATE index_cursors SET last_run = now()
     WHERE contract = (
       SELECT contract FROM index_cursors WHERE done = false
       ORDER BY last_run ASC LIMIT 1 FOR UPDATE SKIP LOCKED
     )
     RETURNING contract, app_id, page_key`,
  );
  if (rows.length === 0) return null;
  const cursor = rows[0] as { contract: string; app_id: string; page_key: string | null };

  let pageKey = cursor.page_key;
  let scanned = 0;
  let inserted = 0;
  let done = false;

  for (let i = 0; i < DISCOVERY_PAGES_PER_RUN; i++) {
    const data = await fetchTransferPage(cursor.contract, pageKey);
    if (data.error) throw new Error(data.error.message);
    const transfers = data.result?.transfers ?? [];
    scanned += transfers.length;
    const froms = [...new Set(transfers.map((t) => t.from?.toLowerCase()).filter(Boolean))];
    if (froms.length > 0) {
      const res = await p.query(
        `INSERT INTO wallets (address, family, discovered_via)
         SELECT unnest($1::text[]), 'evm', $2
         ON CONFLICT (address) DO NOTHING`,
        [froms, cursor.app_id],
      );
      inserted += res.rowCount ?? 0;
    }
    pageKey = data.result?.pageKey ?? null;
    if (!pageKey) {
      done = true;
      break;
    }
  }

  await p.query(
    `UPDATE index_cursors SET page_key = $2, done = $3, transfers_seen = transfers_seen + $4, last_run = now() WHERE contract = $1`,
    [cursor.contract, pageKey, done, scanned],
  );
  return { appId: cursor.app_id, transfersScanned: scanned, walletsInserted: inserted, cursorDone: done };
}

export interface RateResult {
  rated: number;
  errored: number;
  requeued?: number; // transient failures returned to 'pending'
  skipped?: number; // legitimately unrateable (custodial / solana-soon)
}

/** One rating slice: rate a batch of pending wallets with the live engine. */
export async function rateStep(batch = RATE_BATCH): Promise<RateResult> {
  const p = getPool();
  if (!p) return { rated: 0, errored: 0 };
  // Recover wallets stranded in 'rating' by a crashed prior invocation (no
  // timeout would otherwise ever re-pick them), then claim a fresh batch.
  // FOR UPDATE SKIP LOCKED lets overlapping invocations claim disjoint batches.
  await p.query(
    `UPDATE wallets SET status = 'pending'
     WHERE status = 'rating' AND created_at < now() - interval '10 minutes'`,
  );
  const { rows } = await p.query(
    `UPDATE wallets SET status = 'rating'
     WHERE address IN (
       SELECT address FROM wallets WHERE status = 'pending'
       ORDER BY created_at LIMIT $1 FOR UPDATE SKIP LOCKED
     )
     RETURNING address`,
    [batch],
  );
  let rated = 0;
  let errored = 0;
  let requeued = 0;
  let skipped = 0;
  await Promise.all(
    (rows as { address: string }[]).map(async ({ address }) => {
      try {
        const resolution = await resolveWallet(address);
        if (resolution.kind === "unavailable") {
          // Transient all-sources-down blip — requeue for a later tick rather
          // than poisoning the wallet as a permanent 'error'.
          await p.query(`UPDATE wallets SET status = 'pending' WHERE address = $1`, [address]).catch(() => {});
          requeued++;
          return;
        }
        if (resolution.kind !== "ok") {
          // Legitimately unrateable (custodial pool, Solana-not-yet-indexed,
          // invalid) — mark 'skipped' so it's never retried but not an error.
          await p.query(`UPDATE wallets SET status = 'skipped' WHERE address = $1`, [address]).catch(() => {});
          skipped++;
          return;
        }
        const r = resolution.report.result;
        // Previous grade (if any) so subscribed apps get grade-change pushes.
        const prev = await p.query(`SELECT grade, modifier, sanctioned FROM ratings WHERE address = $1`, [address]);
        await p.query(
          `INSERT INTO ratings (address, family, score, grade, modifier, tier, archetype, tx_count, volume_usd, apps_used, kyc_verified, sanctioned, history, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, now())
           ON CONFLICT (address) DO UPDATE SET
             score = EXCLUDED.score, grade = EXCLUDED.grade, modifier = EXCLUDED.modifier,
             tier = EXCLUDED.tier, archetype = EXCLUDED.archetype, tx_count = EXCLUDED.tx_count,
             volume_usd = EXCLUDED.volume_usd, apps_used = EXCLUDED.apps_used,
             kyc_verified = EXCLUDED.kyc_verified, sanctioned = EXCLUDED.sanctioned,
             history = EXCLUDED.history, updated_at = now()`,
          [
            r.address,
            r.family,
            r.score,
            r.grade,
            r.modifier,
            r.tier,
            r.archetype,
            r.totals.txCount,
            Math.round(r.totals.volumeUsd),
            r.totals.appsUsed,
            r.kyc.verified,
            r.sanctions.listed,
            JSON.stringify(resolution.report.history),
          ],
        );
        await p.query(`UPDATE wallets SET status = 'rated' WHERE address = $1`, [address]);
        rated++;

        // Push notifications: grade moved, or wallet newly sanctions-listed.
        const old = prev.rows[0] as { grade: string; modifier: string; sanctioned: boolean } | undefined;
        if (old && `${old.grade}${old.modifier}` !== `${r.grade}${r.modifier}`) {
          await deliverWebhooks("grade.changed", {
            wallet: r.address,
            from: `${old.grade}${old.modifier}`,
            to: `${r.grade}${r.modifier}`,
            score: r.score,
          }).catch(() => {});
        }
        if (r.sanctions.listed && !(old?.sanctioned ?? false)) {
          await deliverWebhooks("sanctions.listed", {
            wallet: r.address,
            list: r.sanctions.list,
          }).catch(() => {});
        }
      } catch (err) {
        console.error(`indexer: rating failed for ${address}:`, err);
        await p.query(`UPDATE wallets SET status = 'error' WHERE address = $1`, [address]).catch(() => {});
        errored++;
      }
    }),
  );
  return { rated, errored, requeued, skipped };
}

export interface UniverseStats {
  discovered: number;
  rated: number;
  pending: number;
  grades: { A: number; B: number; C: number };
  medianScore: number | null;
  transfersScanned: number;
}

export async function universeStats(): Promise<UniverseStats | null> {
  const p = getPool();
  if (!p) return null;
  await initSchema();
  const [w, g, m, c] = await Promise.all([
    p.query(`SELECT count(*)::int AS total, count(*) FILTER (WHERE status = 'rated')::int AS rated, count(*) FILTER (WHERE status = 'pending')::int AS pending FROM wallets`),
    p.query(`SELECT grade, count(*)::int AS n FROM ratings GROUP BY grade`),
    p.query(`SELECT percentile_disc(0.5) WITHIN GROUP (ORDER BY score)::int AS median FROM ratings`),
    p.query(`SELECT coalesce(sum(transfers_seen), 0)::bigint AS seen FROM index_cursors`),
  ]);
  const grades = { A: 0, B: 0, C: 0 };
  for (const row of g.rows as { grade: "A" | "B" | "C"; n: number }[]) grades[row.grade] = row.n;
  return {
    discovered: w.rows[0].total,
    rated: w.rows[0].rated,
    pending: w.rows[0].pending,
    grades,
    medianScore: m.rows[0].median ?? null,
    transfersScanned: Number(c.rows[0].seen),
  };
}
