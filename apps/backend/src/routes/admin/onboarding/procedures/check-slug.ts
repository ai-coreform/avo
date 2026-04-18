import { eq } from "drizzle-orm";
import type { Context } from "hono";
import database from "@/db";
import { venue } from "@/db/schema/auth/venue";
import { slugify } from "@/utils/slugify";

export async function checkSlug(c: Context, query: { slug: string }) {
  const normalized = slugify(query.slug);

  if (!normalized) {
    return c.json({ available: false, slug: "" });
  }

  const existing = await database
    .select({ id: venue.id })
    .from(venue)
    .where(eq(venue.slug, normalized))
    .limit(1);

  return c.json({
    available: existing.length === 0,
    slug: normalized,
  });
}
