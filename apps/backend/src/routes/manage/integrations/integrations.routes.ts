import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import database from "@/db";
import { partner } from "@/db/schema/partner";
import { venueLink } from "@/db/schema/venue-link";
import { webhookDelivery } from "@/db/schema/webhook-delivery";
import { requireOrgAdmin } from "@/middleware/org-admin";
import { revokeVenueLink } from "@/operations/partner/provision";
import {
  deletePendingDeliveriesForLinkRevocation,
  emitEventToPartner,
} from "@/operations/partner/webhooks/events";

/**
 * Manage API — partner integrations (from the venue owner's perspective).
 * Mounted at /api/manage/integrations.
 *
 * Used by the Avo dashboard to:
 *   - list partners currently linked to this venue
 *   - show sync health (last delivery + failure counts)
 *   - let the owner disconnect a partner
 */

const integrationsRoutes = new Hono()
  .use(requireOrgAdmin())
  /**
   * GET /api/manage/integrations
   *
   * Returns all venue_links for the current venue with per-partner metadata
   * and sync health summary (computed from webhook_delivery rows).
   */
  .get("/", async (c) => {
    const member = c.get("member");
    const links = await database
      .select({
        link: venueLink,
        partnerRow: partner,
      })
      .from(venueLink)
      .innerJoin(partner, eq(partner.id, venueLink.partnerId))
      .where(eq(venueLink.venueId, member.venueId))
      .orderBy(desc(venueLink.connectedAt));

    const integrations = await Promise.all(
      links.map(async ({ link, partnerRow }) => {
        const health = await computeHealth(partnerRow.id, member.venueId);
        return {
          partner: {
            slug: partnerRow.slug,
            name: partnerRow.name,
          },
          link: {
            status: link.status,
            connect_venue_id: link.connectVenueId,
            connected_at: link.connectedAt.toISOString(),
            disconnected_at: link.disconnectedAt
              ? link.disconnectedAt.toISOString()
              : null,
          },
          health,
        };
      })
    );

    return c.json({ integrations });
  })
  /**
   * POST /api/manage/integrations/:partnerSlug/disconnect
   *
   * Revokes the link between the current venue and the named partner.
   * Emits `link.revoked` webhook with reason `user_initiated_avo`.
   */
  .post("/:partnerSlug/disconnect", async (c) => {
    const member = c.get("member");
    const partnerSlug = c.req.param("partnerSlug");

    const [row] = await database
      .select({ link: venueLink, partnerRow: partner })
      .from(venueLink)
      .innerJoin(partner, eq(partner.id, venueLink.partnerId))
      .where(
        and(
          eq(partner.slug, partnerSlug),
          eq(venueLink.venueId, member.venueId)
        )
      )
      .limit(1);

    if (!row) {
      return c.json(
        {
          error: {
            code: "not_found",
            message: "No active link with that partner.",
          },
        },
        404
      );
    }

    if (row.link.status === "revoked" || row.link.status === "abandoned") {
      return c.json({
        partner: { slug: row.partnerRow.slug, name: row.partnerRow.name },
        status: row.link.status,
        disconnected_at: (row.link.disconnectedAt ?? new Date()).toISOString(),
      });
    }

    await revokeVenueLink(row.link.id);

    // Notify the partner of the user-initiated disconnect.
    await emitEventToPartner({
      partnerId: row.partnerRow.id,
      venueId: member.venueId,
      eventType: "link.revoked",
      resource: {
        type: "venue_link",
        reason: "user_initiated_avo",
      },
    });

    // Clear any queued deliveries that hadn't fired yet for this link.
    await deletePendingDeliveriesForLinkRevocation(
      row.partnerRow.id,
      member.venueId
    );

    return c.json({
      partner: { slug: row.partnerRow.slug, name: row.partnerRow.name },
      status: "revoked",
      disconnected_at: new Date().toISOString(),
    });
  });

export { integrationsRoutes };

interface HealthSummary {
  last_delivered_at: string | null;
  last_failed_at: string | null;
  pending_count: number;
  dead_letter_count: number;
}

async function computeHealth(
  partnerId: string,
  venueId: string
): Promise<HealthSummary> {
  const deliveries = await database
    .select()
    .from(webhookDelivery)
    .where(
      and(
        eq(webhookDelivery.partnerId, partnerId),
        eq(webhookDelivery.venueId, venueId)
      )
    )
    .orderBy(desc(webhookDelivery.updatedAt))
    .limit(200);

  const summary: HealthSummary = {
    last_delivered_at: null,
    last_failed_at: null,
    pending_count: 0,
    dead_letter_count: 0,
  };

  for (const d of deliveries) {
    accumulateDelivery(summary, d);
  }

  return summary;
}

function accumulateDelivery(
  summary: HealthSummary,
  d: typeof webhookDelivery.$inferSelect
): void {
  if (d.status === "delivered" && d.deliveredAt) {
    bumpIsoMaxIfNewer(summary, "last_delivered_at", d.deliveredAt);
    return;
  }
  if (d.status === "dead_letter") {
    summary.dead_letter_count += 1;
    bumpIsoMaxIfNewer(summary, "last_failed_at", d.updatedAt);
    return;
  }
  if (d.status === "pending" || d.status === "delivering") {
    summary.pending_count += 1;
    return;
  }
  if (d.status === "failed") {
    bumpIsoMaxIfNewer(summary, "last_failed_at", d.updatedAt);
  }
}

function bumpIsoMaxIfNewer(
  summary: HealthSummary,
  key: "last_delivered_at" | "last_failed_at",
  candidate: Date
): void {
  const current = summary[key];
  if (!current || new Date(current) < candidate) {
    summary[key] = candidate.toISOString();
  }
}
