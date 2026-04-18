import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sql";
import { migrate } from "drizzle-orm/bun-sql/migrator";

/**
 * Wipes the database and re-applies all migrations from scratch.
 *
 * We run `migrate()` (not `drizzle-kit push`) so the `drizzle.__drizzle_migrations`
 * tracking table stays consistent with the applied state. Using push here would
 * create drift: the schema ends up correct but the tracking table is empty,
 * which then makes a subsequent `bun run db:migrate` try to re-apply every
 * migration from 0000 and fail on `CREATE TYPE ... already exists`.
 */
async function reset() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.info(
    "🗑️  Dropping public + drizzle schemas (tables, enums, migration history)..."
  );

  // Drop user data + types + everything in public.
  await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
  await db.execute(sql`CREATE SCHEMA public`);
  await db.execute(sql`GRANT ALL ON SCHEMA public TO public`);

  // Drop drizzle's own tracking schema so migrate() starts with a clean slate.
  // If this isn't dropped, stale migration records can cause the migrator to
  // skip migrations that should re-run against the fresh public schema.
  await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);

  console.info("✅ Schemas dropped. Running migrations from scratch...");

  await migrate(db, { migrationsFolder: "src/db/migrations" });

  console.info("✅ Database reset complete");

  process.exit(0);
}

reset().catch((err) => {
  console.error("❌ Reset failed");
  console.error(err);
  process.exit(1);
});
