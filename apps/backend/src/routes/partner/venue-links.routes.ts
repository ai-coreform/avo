import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import database from "@/db";
import { venueLink } from "@/db/schema/venue-link";
import {
  requireVenueIdMatch,
  requireVenueLink,
} from "@/middleware/partner-auth";
import { revokeVenueLink } from "@/operations/partner/provision";
import { emitEventToPartner } from "@/operations/partner/webhooks/events";

/**
 * Routes for managing a venue link from the partner side.
 * Mounted at /api/partner/venues/:venueId
 */
export const venueLinksRoute = new Hono()
  /**
   * DELETE /api/partner/venues/{venueId}/link
   *
   * Revokes the partner's link to this venue. Locale/items persist on Avo
   * but further partner requests with this token will 401.
   *
   * We allow both active and pending_claim links to be revoked.
   */
  .delete(
    "/:venueId/link",
    requireVenueLink({ allowPendingClaim: true }),
    requireVenueIdMatch(),
    async (c) => {
      const link = c.get("venueLink");

      if (link.status === "revoked") {
        return c.json(
          {
            avo_venue_id: link.venueId,
            status: "revoked",
            revoked_at: (link.disconnectedAt ?? new Date()).toISOString(),
          },
          200
        );
      }

      await revokeVenueLink(link.id);

      // Re-read to get the canonical disconnected_at.
      const [updated] = await database
        .select()
        .from(venueLink)
        .where(and(eq(venueLink.id, link.id)))
        .limit(1);

      // Confirm disconnect to the partner — bypasses echo suppression.
      await emitEventToPartner({
        partnerId: link.partnerId,
        venueId: link.venueId,
        eventType: "link.revoked",
        resource: {
          type: "venue_link",
          reason: "user_initiated_partner",
        },
      });

      return c.json(
        {
          avo_venue_id: link.venueId,
          status: "revoked",
          revoked_at: (updated?.disconnectedAt ?? new Date()).toISOString(),
        },
        200
      );
    }
  );
