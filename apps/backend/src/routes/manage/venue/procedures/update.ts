import type { Context } from "hono";
import { updateVenue } from "@/operations/venue/update";
import type { UpdateVenueInput } from "../venue.schemas";

export async function update(c: Context, input: UpdateVenueInput) {
  const member = c.get("member");

  const result = await updateVenue({
    venueId: member.venueId,
    ...input,
  });

  return c.json({
    data: {
      id: result.id,
      name: result.name,
      slug: result.slug,
      logo: result.logo,
      socials: result.socials,
      address: result.address,
      addressLine1: result.addressLine1,
      addressLine2: result.addressLine2,
      city: result.city,
      region: result.region,
      postalCode: result.postalCode,
      country: result.country,
      countryCode: result.countryCode,
      placeId: result.placeId,
      latitude: result.latitude,
      longitude: result.longitude,
      activeMenuId: result.activeMenuId,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    },
  });
}
