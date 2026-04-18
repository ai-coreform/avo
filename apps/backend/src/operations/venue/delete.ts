import { eq, inArray, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import database from "@/db";
import { member } from "@/db/schema/auth/member";
import { user } from "@/db/schema/auth/user";
import { venue } from "@/db/schema/auth/venue";

interface DeleteVenueInput {
  venueId: string;
}

export async function deleteVenue({ venueId }: DeleteVenueInput) {
  return await database.transaction(async (tx) => {
    // 1. Find all member userIds for this venue
    const members = await tx
      .select({ userId: member.userId })
      .from(member)
      .where(eq(member.venueId, venueId));

    // 2. Find users who only belong to this venue (single membership)
    const orphanedUserIds: string[] = [];
    if (members.length > 0) {
      const userIds = members.map((m) => m.userId);

      const membershipCounts = await tx
        .select({
          userId: member.userId,
          count: sql<number>`count(*)::int`,
        })
        .from(member)
        .where(inArray(member.userId, userIds))
        .groupBy(member.userId);

      for (const row of membershipCounts) {
        if (row.count === 1) {
          orphanedUserIds.push(row.userId);
        }
      }
    }

    // 3. Delete the venue (cascades: members, menus, tabs, categories, entries, catalog items, locales, translations)
    const [deletedVenue] = await tx
      .delete(venue)
      .where(eq(venue.id, venueId))
      .returning({ id: venue.id });

    if (!deletedVenue) {
      throw new HTTPException(404, { message: "Venue not found" });
    }

    // 4. Delete orphaned users (those with no other memberships)
    if (orphanedUserIds.length > 0) {
      await tx.delete(user).where(inArray(user.id, orphanedUserIds));
    }

    return deletedVenue;
  });
}
