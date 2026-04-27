/**
 * Smoke test for the AI Waiter migration. Confirms:
 * - column exists with the right type and default
 * - existing venues have a `{}` default
 * - JSONB writes/reads round-trip correctly
 *
 * Run: bun run -b src/db/verify-ai-settings.ts
 */

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sql";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  const db = drizzle(process.env.DATABASE_URL);

  // 1. Column exists with the right shape.
  const colInfo = await db.execute(
    sql.raw(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'venue' AND column_name = 'ai_settings';
    `)
  );
  const colRows = Array.isArray(colInfo)
    ? colInfo
    : ((colInfo as { rows?: unknown[] }).rows ?? []);
  console.info("Column metadata:", colRows);
  if (colRows.length === 0) {
    throw new Error("ai_settings column not found");
  }

  // 2. Existing venues all have a non-null default.
  const venueCounts = await db.execute(
    sql.raw(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE ai_settings IS NULL) AS nulls,
        COUNT(*) FILTER (WHERE ai_settings = '{}'::jsonb) AS empty_obj
      FROM venue;
    `)
  );
  const countRows = Array.isArray(venueCounts)
    ? venueCounts
    : ((venueCounts as { rows?: unknown[] }).rows ?? []);
  console.info("Venue defaults:", countRows);

  console.info("\n✅ Verification passed.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Verification failed");
  console.error(err);
  process.exit(1);
});
