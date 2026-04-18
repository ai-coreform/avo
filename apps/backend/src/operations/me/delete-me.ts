import { eq } from "drizzle-orm";
import type { Context } from "hono";
import database from "@/db";
import { user } from "@/db/schema/auth/user";

export async function deleteMe(c: Context) {
  const { id: userId } = c.get("user");

  // @TODO: Implement proper account deletion
  // If venue has pending bookins, they need to be cancelled before being able to delete it
  // This should:
  // 1. Remove user from all venues
  // 2. Cancel pending bookings
  // 3. Delete user record
  // 4. Invalidate auth session

  await database.delete(user).where(eq(user.id, userId));

  return c.json({ success: true });
}
