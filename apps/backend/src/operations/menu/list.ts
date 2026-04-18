import { asc, eq } from "drizzle-orm";
import database from "@/db";
import { menu } from "@/db/schema/menu";

interface ListMenusInput {
  venueId: string;
}

export function listMenus({ venueId }: ListMenusInput) {
  return database
    .select()
    .from(menu)
    .where(eq(menu.venueId, venueId))
    .orderBy(asc(menu.sortOrder), asc(menu.createdAt));
}
