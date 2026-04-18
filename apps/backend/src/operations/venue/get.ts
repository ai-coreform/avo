import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import database from "@/db";
import { venue } from "@/db/schema/auth/venue";

interface GetVenueInput {
  venueId: string;
}

export async function getVenue({ venueId }: GetVenueInput) {
  const [row] = await database
    .select()
    .from(venue)
    .where(eq(venue.id, venueId))
    .limit(1);

  if (!row) {
    throw new HTTPException(404, { message: "Venue not found" });
  }

  return row;
}
