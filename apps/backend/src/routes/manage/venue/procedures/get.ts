import type { Context } from "hono";
import { getVenue } from "@/operations/venue/get";

export async function get(c: Context) {
  const member = c.get("member");
  const result = await getVenue({ venueId: member.venueId });

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
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    },
  });
}
