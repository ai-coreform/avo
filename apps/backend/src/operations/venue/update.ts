import { and, eq, ne } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import database from "@/db";
import { type VenueSocials, venue } from "@/db/schema/auth/venue";
import { getUniqueVenueSlug } from "./get-unique-slug";

interface UpdateVenueInput {
  venueId: string;
  name?: string;
  slug?: string;
  logo?: string | null;
  socials?: VenueSocials | null;
  address?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
  countryCode?: string | null;
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export async function updateVenue({ venueId, ...fields }: UpdateVenueInput) {
  // If slug is explicitly provided, validate uniqueness
  if (fields.slug) {
    const [existing] = await database
      .select({ id: venue.id })
      .from(venue)
      .where(and(eq(venue.slug, fields.slug), ne(venue.id, venueId)))
      .limit(1);

    if (existing) {
      throw new HTTPException(409, { message: "Slug already in use" });
    }
  }

  // If name changed but no explicit slug, auto-generate one
  if (fields.name && !fields.slug) {
    fields.slug = await getUniqueVenueSlug(fields.name);
  }

  const [updated] = await database
    .update(venue)
    .set(fields)
    .where(eq(venue.id, venueId))
    .returning();

  if (!updated) {
    throw new HTTPException(404, { message: "Venue not found" });
  }

  return updated;
}
