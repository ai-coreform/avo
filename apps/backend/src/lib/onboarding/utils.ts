import { eq } from "drizzle-orm";
import database from "@/db";
import { venue } from "@/db/schema/auth/venue";
import { slugify } from "@/utils/slugify";

/**
 * Compact slug for menu items — strips everything non-alphanumeric.
 */
export function createSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Generate a unique venue slug by querying the DB for conflicts.
 */
export async function generateUniqueVenueSlug(name: string): Promise<string> {
  const baseSlug = slugify(name) || "ristorante";

  for (let attempt = 0; attempt < 25; attempt++) {
    const slug =
      attempt === 0
        ? baseSlug
        : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const existing = await database
      .select({ id: venue.id })
      .from(venue)
      .where(eq(venue.slug, slug))
      .limit(1);

    if (existing.length === 0) {
      return slug;
    }
  }

  throw new Error("Unable to generate a unique venue slug");
}

/**
 * Deduplicates slugs within a batch by appending incrementing suffixes.
 */
export function uniqueSlug(baseTitle: string, used: Set<string>): string {
  const base = createSlug(baseTitle) || "item";
  let slug = base;
  let index = 2;

  while (used.has(slug)) {
    slug = `${base}-${index}`;
    index++;
  }

  used.add(slug);
  return slug;
}
