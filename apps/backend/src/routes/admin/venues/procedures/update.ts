import type { Context } from "hono";
import { updateVenue } from "@/operations/venue/update";
import type { UpdateVenueInput } from "@/routes/manage/venue/venue.schemas";

interface UpdateVenueHandlerInput {
  venueId: string;
}

export async function updateVenueHandler(
  c: Context,
  { venueId }: UpdateVenueHandlerInput,
  body: UpdateVenueInput
) {
  const updated = await updateVenue({ venueId, ...body });

  return c.json({
    data: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt?.toISOString() ?? null,
    },
  });
}
