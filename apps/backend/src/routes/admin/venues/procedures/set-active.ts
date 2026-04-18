import { and, eq } from "drizzle-orm";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import database from "@/db";
import { member } from "@/db/schema/auth/member";
import { session } from "@/db/schema/auth/session";
import { venue } from "@/db/schema/auth/venue";

interface SetActiveVenueInput {
  venueId: string;
}

export async function setActiveVenue(
  c: Context,
  { venueId }: SetActiveVenueInput
) {
  const user = c.get("user");

  // Verify venue exists
  const [venueRow] = await database
    .select({ id: venue.id })
    .from(venue)
    .where(eq(venue.id, venueId))
    .limit(1);

  if (!venueRow) {
    throw new HTTPException(404, { message: "Venue not found" });
  }

  // Update session's activeVenueId directly
  const currentSession = c.get("session");
  await database
    .update(session)
    .set({ activeVenueId: venueId })
    .where(eq(session.id, currentSession.id));

  // Ensure superadmin has a member record so better-auth org endpoints work
  const [existingMember] = await database
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.userId, user.id), eq(member.venueId, venueId)))
    .limit(1);

  if (!existingMember) {
    await database.insert(member).values({
      venueId,
      userId: user.id,
      role: "owner",
      isActive: true,
      createdAt: new Date(),
    });
  }

  return c.json({ success: true, activeVenueId: venueId });
}
