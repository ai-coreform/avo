import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import database from "@/db";
import { member } from "@/db/schema/auth/member";
import { user } from "@/db/schema/auth/user";
import { venue } from "@/db/schema/auth/venue";

interface GetUserInput {
  userId: string;
}

export async function getUser(c: Context, { userId }: GetUserInput) {
  const [userRow] = await database
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!userRow) {
    throw new HTTPException(404, { message: "User not found" });
  }

  const memberships = await database
    .select({
      venueId: member.venueId,
      venueName: venue.name,
      venueSlug: venue.slug,
      role: member.role,
      isActive: member.isActive,
      joinedAt: member.createdAt,
    })
    .from(member)
    .innerJoin(venue, eq(member.venueId, venue.id))
    .where(eq(member.userId, userId));

  return c.json({
    data: {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      phoneNumber: userRow.phoneNumber,
      image: userRow.image,
      role: userRow.role,
      banned: userRow.banned,
      banReason: userRow.banReason,
      banExpires: userRow.banExpires?.toISOString() ?? null,
      emailVerified: userRow.emailVerified,
      createdAt: userRow.createdAt.toISOString(),
      updatedAt: userRow.updatedAt.toISOString(),
      memberships: memberships.map((m) => ({
        ...m,
        joinedAt: m.joinedAt.toISOString(),
      })),
    },
  });
}
