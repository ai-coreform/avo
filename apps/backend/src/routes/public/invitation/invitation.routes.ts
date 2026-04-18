import { zValidator } from "@hono/zod-validator";
import { and, eq, gt } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import database from "@/db";
import { invitation } from "@/db/schema/auth/invitation";
import { user } from "@/db/schema/auth/user";

const checkEmailQuerySchema = z.object({
  id: z.string().uuid(),
});

const publicInvitationRoutes = new Hono().get(
  "/check-email",
  zValidator("query", checkEmailQuerySchema, (result) => {
    if (!result.success) {
      throw result.error;
    }
  }),
  async (c) => {
    const { id } = c.req.valid("query");

    const [inv] = await database
      .select({
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      })
      .from(invitation)
      .where(
        and(
          eq(invitation.id, id),
          eq(invitation.status, "pending"),
          gt(invitation.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!inv) {
      return c.json(
        { error: { message: "Invitation not found or expired" } },
        404
      );
    }

    const [existingUser] = await database
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, inv.email.toLowerCase()))
      .limit(1);

    return c.json({
      data: {
        email: inv.email,
        isRegistered: Boolean(existingUser),
      },
    });
  }
);

export { publicInvitationRoutes };
