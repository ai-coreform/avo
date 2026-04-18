import { and, eq } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import database from "@/db";
import { slugify } from "@/utils/slugify";

const MAX_SLUG_ATTEMPTS = 50;

/**
 * Generates a slug from `baseTitle` that's unique within a scope. Tries the
 * plain slug first, then `-2`, `-3`, ..., falling back to a suffixed random
 * token after too many collisions.
 *
 * Example:
 *   uniqueSlug("Pizza Margherita", {
 *     table: catalogItem,
 *     slugColumn: catalogItem.slug,
 *     scope: [{ column: catalogItem.venueId, value: venueId }],
 *   })
 */
export async function uniqueSlug(
  baseTitle: string,
  opts: {
    table: PgTable;
    slugColumn: PgColumn;
    scope: Array<{ column: PgColumn; value: unknown }>;
  }
): Promise<string> {
  const base = slugify(baseTitle) || "item";
  let candidate = base;
  let attempt = 2;

  for (let i = 0; i < MAX_SLUG_ATTEMPTS; i++) {
    const whereClause = and(
      eq(opts.slugColumn, candidate),
      ...opts.scope.map((s) => eq(s.column, s.value))
    );
    // Cast keeps the generic table type from leaking into Drizzle's
    // "data-modifying subquery" union — we only need presence, not row shape.
    const existing = await database
      .select({ s: opts.slugColumn })
      .from(opts.table as PgTable)
      .where(whereClause)
      .limit(1);

    if (existing.length === 0) {
      return candidate;
    }

    candidate = `${base}-${attempt}`;
    attempt += 1;
  }

  return `${base}-${randomSuffix()}`;
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
function randomSuffix(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}
