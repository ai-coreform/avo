import { count } from "drizzle-orm";
import type { Context } from "hono";
import database from "@/db";
import { member } from "@/db/schema/auth/member";
import { user } from "@/db/schema/auth/user";
import { venue } from "@/db/schema/auth/venue";
import { menu } from "@/db/schema/menu";

export async function getOverviewStats(c: Context) {
  const [usersCount, venuesCount, menusCount, membersCount] = await Promise.all(
    [
      database.select({ count: count() }).from(user),
      database.select({ count: count() }).from(venue),
      database.select({ count: count() }).from(menu),
      database.select({ count: count() }).from(member),
    ]
  );

  return c.json({
    data: {
      totalUsers: usersCount[0]?.count ?? 0,
      totalVenues: venuesCount[0]?.count ?? 0,
      totalMenus: menusCount[0]?.count ?? 0,
      totalMemberships: membersCount[0]?.count ?? 0,
    },
  });
}
