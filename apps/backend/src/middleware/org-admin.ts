import { and, eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import database from "@/db";
import { member } from "@/db/schema/auth/member";

declare module "hono" {
  interface ContextVariableMap {
    member: typeof member.$inferSelect;
  }
}

/**
 * Venue Admin guard – ensures the user is an active venue member
 * with the required role(s).
 *
 * Uses Better Auth's venue member table.
 * By default, allows both "owner" and "admin" roles.
 *
 * This middleware requires venue membership.
 */
export const requireOrgAdmin = (
  allowedRoles: Array<"owner" | "admin" | "member"> = ["owner", "admin"]
) =>
  createMiddleware(async (c, next) => {
    const user = c.get("user");
    const session = c.get("session");

    if (!user) {
      throw new HTTPException(401, {
        message: "Unauthorized",
      });
    }

    const activeVenueId = session?.activeVenueId;

    if (!activeVenueId) {
      throw new HTTPException(403, {
        message: "No active venue. Please select a venue.",
      });
    }

    // Superadmins bypass membership checks — full owner access to any venue
    if (user.role === "superadmin") {
      c.set("member", {
        id: "superadmin-bypass",
        venueId: activeVenueId,
        userId: user.id,
        role: "owner",
        isActive: true,
        createdAt: new Date(),
      } as typeof member.$inferSelect);
      await next();
      return;
    }

    // Look up member record for this user in the active venue
    const [memberRow] = await database
      .select()
      .from(member)
      .where(and(eq(member.userId, user.id), eq(member.venueId, activeVenueId)))
      .limit(1);

    if (!memberRow) {
      throw new HTTPException(403, {
        message: "User is not a member of this venue",
      });
    }

    if (!memberRow.isActive) {
      throw new HTTPException(403, {
        message: "Member is inactive",
      });
    }

    if (
      !allowedRoles.includes(memberRow.role as "owner" | "admin" | "member")
    ) {
      throw new HTTPException(403, {
        message: `Insufficient role. Required: ${allowedRoles.join(", ")}. Got: ${memberRow.role}`,
      });
    }

    c.set("member", memberRow);

    await next();
  });
