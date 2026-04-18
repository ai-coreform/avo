import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import database from "@/db";
import { account } from "@/db/schema/auth/account";
import { user } from "@/db/schema/auth/user";
import { deleteMe } from "@/operations/me/delete-me";
import { getMe } from "@/operations/me/get-me";

const MIN_PASSWORD_LENGTH = 8;

const setupPasswordSchema = z.object({
  password: z
    .string()
    .min(
      MIN_PASSWORD_LENGTH,
      `La password deve contenere almeno ${MIN_PASSWORD_LENGTH} caratteri.`
    ),
});

const meRoutes = new Hono()
  .get("/", async (c) => await getMe(c))
  .delete("/", async (c) => await deleteMe(c))
  /**
   * POST /api/manage/me/accept-tos
   *
   * Records the current user's acceptance of the Terms of Service.
   * Idempotent — re-accepting does not overwrite the original timestamp.
   */
  .post("/accept-tos", async (c) => {
    const current = c.get("user");
    const [existing] = await database
      .select({ tosAcceptedAt: user.tosAcceptedAt })
      .from(user)
      .where(eq(user.id, current.id))
      .limit(1);

    if (existing?.tosAcceptedAt) {
      return c.json({
        tos_accepted_at: existing.tosAcceptedAt.toISOString(),
        already_accepted: true,
      });
    }

    const now = new Date();
    await database
      .update(user)
      .set({ tosAcceptedAt: now })
      .where(eq(user.id, current.id));

    return c.json({
      tos_accepted_at: now.toISOString(),
      already_accepted: false,
    });
  })
  /**
   * GET /api/manage/me/password-status
   *
   * Tells the dashboard whether the current user has a credential-provider
   * password set. Used by the onboarding/welcome page to decide whether to
   * show the "set your password" step.
   */
  .get("/password-status", async (c) => {
    const current = c.get("user");
    const [credential] = await database
      .select({ id: account.id, password: account.password })
      .from(account)
      .where(
        and(
          eq(account.userId, current.id),
          eq(account.providerId, "credential")
        )
      )
      .limit(1);

    return c.json({
      has_password: Boolean(credential?.password),
    });
  })
  /**
   * POST /api/manage/me/setup-password
   *
   * First-time password set for users provisioned via partner (e.g. Connect)
   * who claimed their account via the claim link and were logged in via
   * session cookie without ever setting a password.
   *
   * Refuses to overwrite an existing password — use Better Auth's
   * `changePassword` (authenticated) or `forgetPassword` (unauthenticated)
   * flows for that.
   */
  .post("/setup-password", async (c) => {
    const current = c.get("user");

    const rawBody = await c.req.json().catch(() => null);
    const parsed = setupPasswordSchema.safeParse(rawBody);
    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: {
            code: "INVALID_PAYLOAD",
            message: parsed.error.issues[0]?.message ?? "Payload non valido.",
            field: parsed.error.issues[0]?.path.join("."),
          },
        },
        400
      );
    }

    const now = new Date();
    const hashed = await hashPassword(parsed.data.password);

    const [existing] = await database
      .select({ id: account.id, password: account.password })
      .from(account)
      .where(
        and(
          eq(account.userId, current.id),
          eq(account.providerId, "credential")
        )
      )
      .limit(1);

    if (existing?.password) {
      return c.json(
        {
          success: false,
          error: {
            code: "PASSWORD_ALREADY_SET",
            message:
              "Hai già una password. Usa la funzione 'Password dimenticata?' per cambiarla.",
          },
        },
        409
      );
    }

    if (existing) {
      // Row exists but password column is null — update it.
      await database
        .update(account)
        .set({ password: hashed, updatedAt: now })
        .where(eq(account.id, existing.id));
    } else {
      // No credential provider row yet — create one.
      await database.insert(account).values({
        accountId: current.id,
        providerId: "credential",
        userId: current.id,
        password: hashed,
        createdAt: now,
        updatedAt: now,
      });
    }

    return c.json({ success: true });
  });

export { meRoutes };
