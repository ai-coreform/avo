import type { Context } from "hono";
import { deleteVenue } from "@/operations/venue/delete";

interface DeleteVenueInput {
  venueId: string;
}

export async function deleteVenueHandler(
  c: Context,
  { venueId }: DeleteVenueInput
) {
  await deleteVenue({ venueId });
  return c.json({ success: true });
}
