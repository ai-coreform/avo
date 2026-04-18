import { count, ilike, or, sql } from "drizzle-orm";
import type { Context } from "hono";
import database from "@/db";
import { member } from "@/db/schema/auth/member";
import { venue } from "@/db/schema/auth/venue";
import { menu } from "@/db/schema/menu";

interface ListVenuesInput {
  search?: string;
  limit: number;
  offset: number;
}

export async function listVenues(c: Context, input: ListVenuesInput) {
  const { search, limit, offset } = input;

  const whereCondition = search
    ? or(ilike(venue.name, `%${search}%`), ilike(venue.slug, `%${search}%`))
    : undefined;

  const [venues, totalResult] = await Promise.all([
    database
      .select({
        id: venue.id,
        name: venue.name,
        slug: venue.slug,
        city: venue.city,
        country: venue.country,
        createdAt: venue.createdAt,
        memberCount: sql<number>`(
          SELECT COUNT(*)::int FROM ${member} WHERE ${member.venueId} = ${venue.id}
        )`,
        menuCount: sql<number>`(
          SELECT COUNT(*)::int FROM ${menu} WHERE ${menu.venueId} = ${venue.id}
        )`,
      })
      .from(venue)
      .where(whereCondition)
      .limit(limit)
      .offset(offset)
      .orderBy(venue.createdAt),
    database.select({ count: count() }).from(venue).where(whereCondition),
  ]);

  return c.json({
    data: venues.map((v) => ({
      ...v,
      createdAt: v.createdAt.toISOString(),
    })),
    total: totalResult[0]?.count ?? 0,
    limit,
    offset,
  });
}
