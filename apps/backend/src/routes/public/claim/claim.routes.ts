import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import database from "@/db";
import { session as sessionTable } from "@/db/schema/auth/session";
import { user } from "@/db/schema/auth/user";
import { claimToken } from "@/db/schema/claim-token";
import { venueLink } from "@/db/schema/venue-link";
import { PartnerApiError } from "@/lib/errors/partner-api-error";
import { auth } from "../../../../auth";

/**
 * Public claim endpoints — unauthenticated.
 *
 * The dashboard's /claim/:token page calls these to complete the onboarding
 * flow for a partner-provisioned user.
 */

const CHAR_POOL =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function randomToken(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CHAR_POOL[bytes[i] % CHAR_POOL.length];
  }
  return out;
}

/**
 * Look up the session cookie name + attributes from Better Auth's own context
 * so we always match — including the `__Secure-` prefix that auth adds when
 * baseURL is HTTPS.
 *
 * Mirroring auth's own attributes (secure / sameSite / domain) also guarantees
 * the browser will echo the cookie back under the same conditions auth expects.
 */
async function getSessionCookieInfo(): Promise<{
  name: string;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  domain: string | undefined;
}> {
  const ctx = await auth.$context;
  const { name, attributes } = ctx.authCookies.sessionToken;
  const sameSiteAttr = attributes.sameSite;
  const sameSite: "lax" | "strict" | "none" =
    sameSiteAttr === "strict" || sameSiteAttr === "none" ? sameSiteAttr : "lax";
  return {
    name,
    secure: !!attributes.secure,
    sameSite,
    domain: attributes.domain,
  };
}

/**
 * Build the signed cookie value in Better Auth's exact format:
 *
 *     <token>.<base64url-no-padding(hmac-sha256(secret, token))>
 *
 * Better Auth's `getSession()` verifies cookies using
 * `createHMAC("SHA-256", "base64urlnopad").verify(secret, token, sig)`.
 *
 * Hono's built-in `setSignedCookie` uses plain base64 (with padding) —
 * incompatible — so we sign by hand here.
 */
/**
 * Sign exactly as better-call (the framework Better Auth uses):
 *
 *   signed = `${token}.${base64(hmac-sha256(secret, token))}`
 *
 * Standard base64 (with padding). Hono's `setCookie` URL-encodes the value
 * once during serialization, so we MUST NOT url-encode here (double-encoding
 * produces `%253D` instead of `%3D` and the verify side rejects it).
 */
function signCookieValue(token: string, secret: string): string {
  const signature = createHmac("sha256", secret).update(token).digest("base64");
  return `${token}.${signature}`;
}

const SESSION_LIFETIME_DAYS = 30;

export const claimRoute = new Hono()
  /**
   * GET /api/public/claim/:token/preview
   *
   * Non-mutating: returns info about the claim target for the dashboard to
   * render a preview (e.g. "Welcome, Mario. Trattoria da Mario is ready.").
   */
  .get("/:token/preview", async (c) => {
    const token = c.req.param("token");
    const result = await lookupClaim(token);
    if (result.kind !== "ok") {
      throw new PartnerApiError(410, {
        code: `claim_${result.kind}`,
        message: CLAIM_ERROR_MESSAGES[result.kind],
      });
    }

    return c.json({
      user: {
        email: result.user.email,
        name: result.user.name,
      },
      venue: {
        id: result.venueId,
      },
      status: "pending",
      expires_at: result.token.expiresAt.toISOString(),
    });
  })
  /**
   * POST /api/public/claim/:token
   *
   * Activates the pending user, marks the venue_link active, creates an
   * authenticated session, and sets the session cookie.
   *
   * After this the dashboard can redirect to /onboarding/welcome.
   */
  .post("/:token", async (c) => {
    const token = c.req.param("token");
    const result = await lookupClaim(token);
    if (result.kind !== "ok") {
      throw new PartnerApiError(410, {
        code: `claim_${result.kind}`,
        message: CLAIM_ERROR_MESSAGES[result.kind],
      });
    }

    const now = new Date();
    const sessionToken = randomToken(48);
    const expiresAt = new Date(
      now.getTime() + SESSION_LIFETIME_DAYS * 24 * 60 * 60 * 1000
    );

    await database.transaction(async (tx) => {
      await tx
        .update(user)
        .set({
          status: "active",
          emailVerified: true,
          updatedAt: now,
        })
        .where(eq(user.id, result.user.id));

      await tx
        .update(venueLink)
        .set({ status: "active", connectedAt: now })
        .where(eq(venueLink.id, result.venueLinkId));

      await tx
        .update(claimToken)
        .set({ usedAt: now })
        .where(eq(claimToken.token, token));

      await tx.insert(sessionTable).values({
        token: sessionToken,
        userId: result.user.id,
        expiresAt,
        createdAt: now,
        updatedAt: now,
        activeVenueId: result.venueId,
        ipAddress: c.req.header("x-forwarded-for") ?? null,
        userAgent: c.req.header("user-agent") ?? null,
      });
    });

    // Set the Better Auth session cookie. Name, signing secret, and
    // attributes are pulled from auth.$context so we match exactly what
    // auth.api.getSession() expects (including __Secure- prefix on HTTPS
    // baseURL deployments).
    const authSecret = process.env.BETTER_AUTH_SECRET;
    if (!authSecret) {
      throw new Error(
        "BETTER_AUTH_SECRET is not configured — cannot issue claim session cookie."
      );
    }
    const cookieInfo = await getSessionCookieInfo();
    setCookie(c, cookieInfo.name, signCookieValue(sessionToken, authSecret), {
      path: "/",
      httpOnly: true,
      secure: cookieInfo.secure,
      sameSite: (cookieInfo.sameSite.charAt(0).toUpperCase() +
        cookieInfo.sameSite.slice(1)) as "Lax" | "Strict" | "None",
      maxAge: SESSION_LIFETIME_DAYS * 24 * 60 * 60,
      domain: cookieInfo.domain,
    });

    return c.json({
      redirect_to: "/onboarding/welcome",
      session_expires_at: expiresAt.toISOString(),
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      venue_id: result.venueId,
    });
  });

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

type LookupResult =
  | {
      kind: "ok";
      token: typeof claimToken.$inferSelect;
      user: typeof user.$inferSelect;
      venueId: string;
      venueLinkId: string;
    }
  | { kind: "not_found" }
  | { kind: "already_used" }
  | { kind: "expired" };

async function lookupClaim(token: string): Promise<LookupResult> {
  const [row] = await database
    .select({
      claim: claimToken,
      userRow: user,
    })
    .from(claimToken)
    .innerJoin(user, eq(user.id, claimToken.userId))
    .where(eq(claimToken.token, token))
    .limit(1);

  if (!row) {
    return { kind: "not_found" };
  }

  if (row.claim.usedAt) {
    return { kind: "already_used" };
  }

  if (row.claim.expiresAt < new Date()) {
    return { kind: "expired" };
  }

  return {
    kind: "ok",
    token: row.claim,
    user: row.userRow,
    venueId: row.claim.venueId,
    venueLinkId: row.claim.venueLinkId,
  };
}

const CLAIM_ERROR_MESSAGES: Record<
  "not_found" | "already_used" | "expired",
  string
> = {
  not_found: "Claim token not recognized.",
  already_used: "This claim has already been completed.",
  expired: "Claim has expired.",
};

// `auth` is imported so future work can swap our manual session creation for
// Better Auth's internalAdapter.createSession(userId) via `auth.$context`.
// Referencing the value here keeps tree-shakers from dropping the import.
export const __authRef = auth;
