import { eq } from "drizzle-orm";
import type { Context } from "hono";

import database from "@/db";
import { member } from "@/db/schema/auth/member";
import { user } from "@/db/schema/auth/user";

export async function getMe(c: Context) {
  const authenticatedUser = c.get("user");

  const [userWithMembership] = await database
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: member.role,
      venueId: member.venueId,
    })
    .from(user)
    .leftJoin(member, eq(member.userId, user.id))
    .where(eq(user.id, authenticatedUser.id))
    .limit(1);

  return c.json({
    id: userWithMembership?.id,
    name: userWithMembership?.name,
    email: userWithMembership?.email,
    role: userWithMembership?.role,
    venueId: userWithMembership?.venueId,
  });
}
