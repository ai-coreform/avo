/**
 * One-off repair: marks migrations 0000–0002 as applied in
 * `drizzle.__drizzle_migrations` so a subsequent `db:migrate` only runs 0003+.
 *
 * Use case: a local DB that was bootstrapped with `db:push` (or older tooling)
 * has all the tables but no migration tracking — so the runner blows up trying
 * to re-CREATE existing tables.
 *
 * Computes the exact same SHA256 hash drizzle uses (sha256 of the .sql file
 * contents) so future migrate runs treat these as already applied.
 *
 * Idempotent: skips rows whose hash is already present. Safe to re-run.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sql";

const ALREADY_APPLIED_TAGS = [
  "0000_closed_the_executioner",
  "0001_webhook_delivery",
  "0002_bumpy_lockjaw",
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  const db = drizzle(process.env.DATABASE_URL);
  const migrationsDir = path.resolve("src/db/migrations");
  const journalPath = path.join(migrationsDir, "meta/_journal.json");
  const journal = JSON.parse(fs.readFileSync(journalPath, "utf-8"));

  // Ensure the tracking table exists (drizzle creates it on first migrate run).
  await db.execute(sql.raw(`CREATE SCHEMA IF NOT EXISTS "drizzle";`));
  await db.execute(
    sql.raw(`CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    );`)
  );

  for (const tag of ALREADY_APPLIED_TAGS) {
    const entry = journal.entries.find(
      (e: { tag: string; when: number }) => e.tag === tag
    );
    if (!entry) {
      throw new Error(`Journal entry for ${tag} not found`);
    }

    const sqlPath = path.join(migrationsDir, `${tag}.sql`);
    const content = fs.readFileSync(sqlPath, "utf-8");
    const hash = crypto.createHash("sha256").update(content).digest("hex");

    const existing = await db.execute(
      sql.raw(
        `SELECT id FROM "drizzle"."__drizzle_migrations" WHERE hash = '${hash}' LIMIT 1;`
      )
    );

    // Drizzle's bun-sql client returns rows directly on the result.
    const rows = Array.isArray(existing)
      ? existing
      : ((existing as { rows?: unknown[] }).rows ?? []);

    if (rows.length > 0) {
      console.info(`✓ ${tag} already tracked, skipping`);
      continue;
    }

    await db.execute(
      sql.raw(
        `INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ('${hash}', ${entry.when});`
      )
    );
    console.info(`+ ${tag} marked as applied (hash ${hash.slice(0, 12)}…)`);
  }

  console.info(
    "\n✅ Repair complete. Run `bun run db:migrate` to apply 0003+."
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Repair failed");
  console.error(err);
  process.exit(1);
});
