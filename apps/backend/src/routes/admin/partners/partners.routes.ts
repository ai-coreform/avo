import { zValidator } from "@hono/zod-validator";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import database from "@/db";
import { venue } from "@/db/schema/auth/venue";
import { partner } from "@/db/schema/partner";
import { venueLink } from "@/db/schema/venue-link";
import {
  WEBHOOK_DELIVERY_STATUS_VALUES,
  type WebhookDeliveryStatus,
  webhookDelivery,
} from "@/db/schema/webhook-delivery";
import {
  createPartner,
  rotatePartner,
  updatePartnerMeta,
} from "@/operations/admin/partners";

function asWebhookDeliveryStatus(
  value: string | undefined
): WebhookDeliveryStatus | null {
  if (!value) {
    return null;
  }
  return (WEBHOOK_DELIVERY_STATUS_VALUES as readonly string[]).includes(value)
    ? (value as WebhookDeliveryStatus)
    : null;
}

// Slug: lowercase letters, digits, dashes; 2-40 chars.
const slugRegex = /^[a-z][a-z0-9-]{1,39}$/;

const createPartnerBodySchema = z
  .object({
    slug: z.string().regex(slugRegex),
    name: z.string().min(1).max(200),
    webhook_url: z.string().url().startsWith("https://"),
    ip_allowlist: z.array(z.string().min(1)).max(64).optional(),
  })
  .strict();

const rotatePartnerBodySchema = z
  .object({
    immediately: z.boolean().optional(),
  })
  .strict();

const updatePartnerBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    webhook_url: z.string().url().startsWith("https://").optional(),
    ip_allowlist: z.array(z.string().min(1)).max(64).optional(),
  })
  .strict();

/**
 * Internal admin routes for inspecting + operating partner integrations.
 * Mounted at /api/admin/partners.
 *
 * Guarded by the existing platform-admin middleware on the admin router.
 */

const partnersRoutes = new Hono()
  /**
   * GET /api/admin/partners
   *
   * Overview of every configured partner: link counts by status + dead-letter
   * count. The output is the minimum needed to paint the admin dashboard
   * landing card without drilling in.
   */
  .get("/", async (c) => {
    const partners = await database.select().from(partner);

    const rows = await Promise.all(
      partners.map(async (p) => {
        const linkCounts = await getLinkStatusCounts(p.id);
        const deadLetterCount = await getDeadLetterCount(p.id);
        return {
          slug: p.slug,
          name: p.name,
          webhook_url: p.webhookUrl,
          feature_flags: p.featureFlags,
          created_at: p.createdAt.toISOString(),
          links: linkCounts,
          dead_letter_count: deadLetterCount,
        };
      })
    );

    return c.json({ partners: rows });
  })
  /**
   * POST /api/admin/partners
   *
   * Creates a new partner. Returns API key + webhook secret ONCE — operators
   * must copy them immediately into a secure handoff channel.
   */
  .post(
    "/",
    zValidator("json", createPartnerBodySchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: {
              code: "invalid_payload",
              message: result.error.issues[0]?.message ?? "Invalid payload",
              field: result.error.issues[0]?.path.join("."),
            },
          },
          400
        );
      }
    }),
    async (c) => {
      const body = c.req.valid("json");
      const result = await createPartner({
        slug: body.slug,
        name: body.name,
        webhookUrl: body.webhook_url,
        ipAllowlist: body.ip_allowlist,
      });
      if (!result.ok) {
        return c.json(
          { error: { code: result.code, message: result.message } },
          409
        );
      }

      return c.json(
        {
          partner: {
            slug: result.result.partner.slug,
            name: result.result.partner.name,
            webhook_url: result.result.partner.webhookUrl,
            ip_allowlist: result.result.partner.ipAllowlist,
            created_at: result.result.partner.createdAt.toISOString(),
          },
          credentials: {
            api_key: result.result.credentials.apiKey,
            webhook_secret: result.result.credentials.webhookSecret,
          },
          warning:
            "Copy these credentials now — they cannot be retrieved later.",
        },
        201
      );
    }
  )
  /**
   * PATCH /api/admin/partners/:slug
   *
   * Update non-credential metadata (name, webhook_url, IP allowlist).
   */
  .patch(
    "/:slug",
    zValidator("json", updatePartnerBodySchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: {
              code: "invalid_payload",
              message: result.error.issues[0]?.message ?? "Invalid payload",
              field: result.error.issues[0]?.path.join("."),
            },
          },
          400
        );
      }
    }),
    async (c) => {
      const slug = c.req.param("slug");
      const body = c.req.valid("json");
      const result = await updatePartnerMeta(slug, {
        name: body.name,
        webhookUrl: body.webhook_url,
        ipAllowlist: body.ip_allowlist,
      });
      if (!result.ok) {
        return c.json(
          { error: { code: result.code, message: result.message } },
          404
        );
      }
      return c.json({
        partner: {
          slug: result.partner.slug,
          name: result.partner.name,
          webhook_url: result.partner.webhookUrl,
          ip_allowlist: result.partner.ipAllowlist,
        },
      });
    }
  )
  /**
   * POST /api/admin/partners/:slug/rotate
   *
   * Generates a new API key. Returns plaintext key ONCE. Previous key stays
   * valid 24h unless `immediately: true` is passed.
   */
  .post(
    "/:slug/rotate",
    zValidator("json", rotatePartnerBodySchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: {
              code: "invalid_payload",
              message: result.error.issues[0]?.message ?? "Invalid payload",
            },
          },
          400
        );
      }
    }),
    async (c) => {
      const slug = c.req.param("slug");
      const body = c.req.valid("json");
      const result = await rotatePartner(slug, {
        immediately: body.immediately ?? false,
      });
      if (!result.ok) {
        return c.json(
          { error: { code: result.code, message: result.message } },
          404
        );
      }
      return c.json({
        partner: {
          slug: result.result.partner.slug,
          name: result.result.partner.name,
        },
        credentials: {
          api_key: result.result.apiKey,
        },
        overlap_expires_at: result.result.overlapExpiresAt
          ? result.result.overlapExpiresAt.toISOString()
          : null,
        warning:
          "Copy this API key now — it cannot be retrieved later. webhook_secret is unchanged by rotation.",
      });
    }
  )
  /**
   * GET /api/admin/partners/:slug/links
   *
   * Per-venue links for a given partner. Includes venue name so the operator
   * can match to known restaurants at a glance.
   */
  .get("/:slug/links", async (c) => {
    const slug = c.req.param("slug");
    const [partnerRow] = await database
      .select()
      .from(partner)
      .where(eq(partner.slug, slug))
      .limit(1);
    if (!partnerRow) {
      return c.json(
        { error: { code: "not_found", message: "Partner not found." } },
        404
      );
    }

    const links = await database
      .select({
        link: venueLink,
        venueName: venue.name,
        venueSlug: venue.slug,
      })
      .from(venueLink)
      .innerJoin(venue, eq(venue.id, venueLink.venueId))
      .where(eq(venueLink.partnerId, partnerRow.id))
      .orderBy(desc(venueLink.connectedAt))
      .limit(500);

    return c.json({
      partner: { slug: partnerRow.slug, name: partnerRow.name },
      links: links.map(({ link, venueName, venueSlug }) => ({
        avo_venue_id: link.venueId,
        venue_name: venueName,
        venue_slug: venueSlug,
        connect_venue_id: link.connectVenueId,
        status: link.status,
        connected_at: link.connectedAt.toISOString(),
        disconnected_at: link.disconnectedAt
          ? link.disconnectedAt.toISOString()
          : null,
      })),
    });
  })
  /**
   * GET /api/admin/partners/:slug/deliveries
   *
   * Recent webhook deliveries. Supports `?status=` + `?limit=` query params.
   */
  .get(
    "/:slug/deliveries",
    zValidator(
      "query",
      z.object({
        status: z.string().optional(),
        limit: z.string().optional(),
      })
    ),
    async (c) => {
      const slug = c.req.param("slug");
      const query = c.req.valid("query");
      const status = query.status;
      const limit = Math.min(Number(query.limit ?? 100) || 100, 500);

      const [partnerRow] = await database
        .select()
        .from(partner)
        .where(eq(partner.slug, slug))
        .limit(1);
      if (!partnerRow) {
        return c.json(
          { error: { code: "not_found", message: "Partner not found." } },
          404
        );
      }

      const conditions = [eq(webhookDelivery.partnerId, partnerRow.id)];
      const validStatus = asWebhookDeliveryStatus(status);
      if (validStatus) {
        conditions.push(eq(webhookDelivery.status, validStatus));
      }

      const rows = await database
        .select()
        .from(webhookDelivery)
        .where(and(...conditions))
        .orderBy(desc(webhookDelivery.updatedAt))
        .limit(limit);

      return c.json({
        deliveries: rows.map((r) => ({
          id: r.id,
          venue_id: r.venueId,
          event_type: r.eventType,
          status: r.status,
          attempts: r.attempts,
          next_attempt_at: r.nextAttemptAt.toISOString(),
          delivered_at: r.deliveredAt ? r.deliveredAt.toISOString() : null,
          last_status: r.lastStatus,
          last_error: r.lastError,
          created_at: r.createdAt.toISOString(),
          updated_at: r.updatedAt.toISOString(),
          payload: r.payload,
        })),
      });
    }
  )
  /**
   * POST /api/admin/partners/:slug/deliveries/:deliveryId/resend
   *
   * Re-enqueue a delivery for immediate retry. Intended for operators
   * diagnosing "why didn't Connect receive X?" — if the partner endpoint is
   * now working, a resend re-fires without resetting attempts.
   */
  .post("/:slug/deliveries/:deliveryId/resend", async (c) => {
    const deliveryId = c.req.param("deliveryId");
    const [row] = await database
      .select()
      .from(webhookDelivery)
      .where(eq(webhookDelivery.id, deliveryId))
      .limit(1);
    if (!row) {
      return c.json(
        { error: { code: "not_found", message: "Delivery not found." } },
        404
      );
    }

    await database
      .update(webhookDelivery)
      .set({
        status: "pending",
        nextAttemptAt: new Date(),
      })
      .where(eq(webhookDelivery.id, deliveryId));

    return c.json({ id: deliveryId, status: "pending" });
  });

export { partnersRoutes };

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

interface LinkStatusCounts {
  active: number;
  pending_claim: number;
  revoked: number;
  abandoned: number;
}

async function getLinkStatusCounts(
  partnerId: string
): Promise<LinkStatusCounts> {
  const rows = await database
    .select({
      status: venueLink.status,
      n: count(venueLink.id),
    })
    .from(venueLink)
    .where(eq(venueLink.partnerId, partnerId))
    .groupBy(venueLink.status);

  const out: LinkStatusCounts = {
    active: 0,
    pending_claim: 0,
    revoked: 0,
    abandoned: 0,
  };
  for (const r of rows) {
    if (r.status in out) {
      out[r.status as keyof LinkStatusCounts] = Number(r.n);
    }
  }
  return out;
}

async function getDeadLetterCount(partnerId: string): Promise<number> {
  const [row] = await database
    .select({ n: sql<number>`count(*)::int` })
    .from(webhookDelivery)
    .where(
      and(
        eq(webhookDelivery.partnerId, partnerId),
        eq(webhookDelivery.status, "dead_letter")
      )
    );
  return Number(row?.n ?? 0);
}
