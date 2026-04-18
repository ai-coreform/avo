import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import database from "@/db";
import { member } from "@/db/schema/auth/member";
import { user } from "@/db/schema/auth/user";
import { venue } from "@/db/schema/auth/venue";
import { menu } from "@/db/schema/menu";

interface GetVenueInput {
  venueId: string;
}

export async function getVenue(c: Context, { venueId }: GetVenueInput) {
  const [venueRow] = await database
    .select()
    .from(venue)
    .where(eq(venue.id, venueId))
    .limit(1);

  if (!venueRow) {
    throw new HTTPException(404, { message: "Venue not found" });
  }

  const [members, menus] = await Promise.all([
    database
      .select({
        userId: member.userId,
        userName: user.name,
        userEmail: user.email,
        role: member.role,
        isActive: member.isActive,
        joinedAt: member.createdAt,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.venueId, venueId)),
    database
      .select({
        id: menu.id,
        name: menu.name,
        slug: menu.slug,
        status: menu.status,
        createdAt: menu.createdAt,
      })
      .from(menu)
      .where(eq(menu.venueId, venueId))
      .orderBy(menu.createdAt),
  ]);

  return c.json({
    data: {
      ...venueRow,
      createdAt: venueRow.createdAt.toISOString(),
      updatedAt: venueRow.updatedAt?.toISOString() ?? null,
      members: members.map((m) => ({
        ...m,
        joinedAt: m.joinedAt.toISOString(),
      })),
      menus: menus.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
    },
  });
}
