import { like } from "drizzle-orm";
import database from "@/db";
import { venue } from "@/db/schema/auth/venue";
import { slugify } from "@/utils/slugify";

export async function getUniqueVenueSlug(name: string): Promise<string> {
  const baseSlug = slugify(name) || "venue";

  const existingSlugs = await database
    .select({ slug: venue.slug })
    .from(venue)
    .where(like(venue.slug, `${baseSlug}%`));

  const slugSet = new Set(existingSlugs.map((r) => r.slug));

  if (!slugSet.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (slugSet.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseSlug}-${suffix}`;
}
