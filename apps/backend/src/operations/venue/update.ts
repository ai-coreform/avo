import { and, eq, ne } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import database from "@/db";
import { type VenueSocials, venue } from "@/db/schema/auth/venue";
import type { AiWaiterSettings } from "@/operations/chat/ai-waiter-types";
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
  /**
   * Partial AI Waiter settings. `null` on a field clears it (back to default);
   * `undefined`/absent leaves it untouched. Other fields not in this object are
   * preserved on the persisted JSONB.
   */
  aiSettings?: Partial<Record<keyof AiWaiterSettings, unknown>>;
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

  // Merge aiSettings into the existing JSONB rather than replacing — this
  // preserves forward-compat fields (ownerInstructions, promotions, …) that
  // the AI Waiter form doesn't yet manage. `null` on a field clears it.
  const { aiSettings: incomingAi, ...rest } = fields;
  const setFields: Record<string, unknown> = { ...rest };

  if (incomingAi) {
    const [current] = await database
      .select({ aiSettings: venue.aiSettings })
      .from(venue)
      .where(eq(venue.id, venueId))
      .limit(1);

    if (!current) {
      throw new HTTPException(404, { message: "Venue not found" });
    }

    setFields.aiSettings = mergeAiSettings(current.aiSettings, incomingAi);
  }

  const [updated] = await database
    .update(venue)
    .set(setFields)
    .where(eq(venue.id, venueId))
    .returning();

  if (!updated) {
    throw new HTTPException(404, { message: "Venue not found" });
  }

  return updated;
}

function mergeAiSettings(
  current: AiWaiterSettings,
  incoming: Partial<Record<keyof AiWaiterSettings, unknown>>
): AiWaiterSettings {
  const merged: Record<string, unknown> = { ...current };
  for (const [k, v] of Object.entries(incoming)) {
    if (v === null) {
      delete merged[k];
    } else if (v !== undefined) {
      merged[k] = v;
    }
  }
  return merged as AiWaiterSettings;
}
