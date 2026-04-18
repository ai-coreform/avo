import { count, ilike, or } from "drizzle-orm";
import type { Context } from "hono";
import database from "@/db";
import { user } from "@/db/schema/auth/user";

interface ListUsersInput {
  search?: string;
  limit: number;
  offset: number;
}

export async function listUsers(c: Context, input: ListUsersInput) {
  const { search, limit, offset } = input;

  const whereCondition = search
    ? or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))
    : undefined;

  const [users, totalResult] = await Promise.all([
    database
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        banned: user.banned,
        banReason: user.banReason,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(whereCondition)
      .limit(limit)
      .offset(offset)
      .orderBy(user.createdAt),
    database.select({ count: count() }).from(user).where(whereCondition),
  ]);

  return c.json({
    data: users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
    total: totalResult[0]?.count ?? 0,
    limit,
    offset,
  });
}
