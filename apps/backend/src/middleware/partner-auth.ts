import { password } from "bun";
import { and, eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import database from "@/db";
import { venue } from "@/db/schema/auth/venue";
import { partner } from "@/db/schema/partner";
import { venueLink } from "@/db/schema/venue-link";

declare module "hono" {
  interface ContextVariableMap {
    partner: typeof partner.$inferSelect;
    venueLink: typeof venueLink.$inferSelect;
    partnerVenue: typeof venue.$inferSelect;
  }
}

const BEARER_PREFIX = "Bearer ";
const AUTH_HEADER = "authorization";
const VENUE_LINK_HEADER = "x-avo-venue-link";

/**
 * Extracts the bearer token from the Authorization header.
 * Returns null if the header is missing or malformed.
 */
function extractBearer(rawHeader: string | undefined): string | null {
  if (!rawHeader) {
    return null;
  }
  if (!rawHeader.startsWith(BEARER_PREFIX)) {
    return null;
  }
  const token = rawHeader.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
}

/**
 * Verifies the presented API key against the partner's stored hash and,
 * during a rotation overlap window, the previous hash.
 */
async function matchApiKey(
  presented: string,
  partnerRow: typeof partner.$inferSelect
): Promise<boolean> {
  if (await password.verify(presented, partnerRow.apiKeyHash)) {
    return true;
  }
  const prevHash = partnerRow.apiKeyHashPrevious;
  const prevExpiry = partnerRow.apiKeyPreviousExpiresAt;
  if (prevHash && prevExpiry && prevExpiry > new Date()) {
    return await password.verify(presented, prevHash);
  }
  return false;
}

/**
 * Finds the partner whose slug matches the API key prefix, then verifies
 * the key against the hashed value. Returns the partner row, or null.
 *
 * To keep lookup cheap we iterate all partners (expected O(1–2) rows for v1).
 * If the partner count grows we can add a key-prefix column and index.
 */
async function findPartnerByApiKey(
  presentedKey: string
): Promise<typeof partner.$inferSelect | null> {
  const allPartners = await database.select().from(partner);
  for (const row of allPartners) {
    if (await matchApiKey(presentedKey, row)) {
      return row;
    }
  }
  return null;
}

/**
 * Ensures the request presents a valid partner API key.
 * On success attaches `partner` to the Hono context.
 */
export const requirePartner = () =>
  createMiddleware(async (c, next) => {
    const presented = extractBearer(c.req.header(AUTH_HEADER));
    if (!presented) {
      throw new HTTPException(401, {
        message: JSON.stringify({
          error: {
            code: "missing_api_key",
            message: "Authorization header with Bearer token is required.",
          },
        }),
      });
    }

    const partnerRow = await findPartnerByApiKey(presented);
    if (!partnerRow) {
      throw new HTTPException(401, {
        message: JSON.stringify({
          error: {
            code: "invalid_api_key",
            message: "API key does not match any partner.",
          },
        }),
      });
    }

    c.set("partner", partnerRow);
    await next();
  });

export interface RequireVenueLinkOptions {
  /**
   * When true, links in `pending_claim` state are accepted (catalog write path
   * during pre-provision). Default false — only `active` links pass.
   */
  allowPendingClaim?: boolean;
}

/**
 * Ensures the request presents a valid venue link token and, indirectly,
 * that the link belongs to the authenticated partner.
 *
 * Must be used after `requirePartner()`.
 */
export const requireVenueLink = (opts: RequireVenueLinkOptions = {}) =>
  createMiddleware(async (c, next) => {
    const partnerRow = c.get("partner");
    if (!partnerRow) {
      throw new HTTPException(500, {
        message: "requireVenueLink used without requirePartner",
      });
    }

    const token = c.req.header(VENUE_LINK_HEADER);
    if (!token) {
      throw new HTTPException(401, {
        message: JSON.stringify({
          error: {
            code: "missing_venue_link",
            message:
              "X-Avo-Venue-Link header is required for venue-scoped routes.",
          },
        }),
      });
    }

    const [linkRow] = await database
      .select()
      .from(venueLink)
      .where(
        and(
          eq(venueLink.linkToken, token),
          eq(venueLink.partnerId, partnerRow.id)
        )
      )
      .limit(1);

    if (!linkRow) {
      throw new HTTPException(401, {
        message: JSON.stringify({
          error: {
            code: "invalid_venue_link",
            message:
              "Venue link token does not match any link for this partner.",
          },
        }),
      });
    }

    const allowedStatuses = opts.allowPendingClaim
      ? ["active", "pending_claim"]
      : ["active"];
    if (!allowedStatuses.includes(linkRow.status)) {
      throw new HTTPException(403, {
        message: JSON.stringify({
          error: {
            code: "venue_link_not_active",
            message: `Venue link is in state '${linkRow.status}'.`,
          },
        }),
      });
    }

    const [venueRow] = await database
      .select()
      .from(venue)
      .where(eq(venue.id, linkRow.venueId))
      .limit(1);

    if (!venueRow) {
      // Shouldn't happen (FK ensures this), but defend anyway.
      throw new HTTPException(500, {
        message: "Venue referenced by link no longer exists",
      });
    }

    c.set("venueLink", linkRow);
    c.set("partnerVenue", venueRow);
    await next();
  });

/**
 * Validates that the `{venueId}` path param matches the venue attached by
 * `requireVenueLink()`. Prevents a partner from passing a token for venue A
 * and hitting a path for venue B.
 */
export const requireVenueIdMatch = (paramName = "venueId") =>
  createMiddleware(async (c, next) => {
    const requestedVenueId = c.req.param(paramName);
    const linkedVenue = c.get("partnerVenue");
    if (!linkedVenue) {
      throw new HTTPException(500, {
        message: "requireVenueIdMatch used without requireVenueLink",
      });
    }
    if (requestedVenueId !== linkedVenue.id) {
      throw new HTTPException(401, {
        message: JSON.stringify({
          error: {
            code: "invalid_venue_link",
            message:
              "Venue link token does not authorize access to this venue id.",
          },
        }),
      });
    }
    await next();
  });

// Re-export for tests that want to hand-craft a partner context.
export { BEARER_PREFIX };
