import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { partnerErrors } from "@/lib/errors/partner-api-error";
import {
  requireVenueIdMatch,
  requireVenueLink,
} from "@/middleware/partner-auth";
import {
  bulkUpsertCatalogItems,
  createCatalogItem,
  deleteCatalogItemById,
  getCatalogItemByExternalId,
  getCatalogItemById,
  listCatalogItems,
  updateCatalogItemRow,
} from "@/operations/partner/catalog-items";
import { serializeCatalogItem } from "@/operations/partner/shared/serializers";
import { emitEvent } from "@/operations/partner/webhooks/events";
import {
  bulkCatalogItemsBodySchema,
  createCatalogItemBodySchema,
  listCatalogItemsQuerySchema,
  updateCatalogItemBodySchema,
} from "./catalog-items.schemas";
import { PARTNER_SOURCE } from "./common.schemas";

const PARTNER_EVENT_SOURCE = `partner:${PARTNER_SOURCE}`;

function isImportRequest(c: {
  req: { header: (name: string) => string | undefined };
}): boolean {
  return c.req.header("X-Avo-Import") === "true";
}

/**
 * Partner API — catalog items resource.
 * Mounted at /api/partner/venues/:venueId/catalog/items
 *
 * Every route requires `X-Avo-Venue-Link` and validates the path venueId
 * matches the linked venue.
 */
export const catalogItemsRoute = new Hono()
  .use(requireVenueLink())
  .use(requireVenueIdMatch())
  /**
   * GET /catalog/items — list, paginated.
   */
  .get(
    "/",
    zValidator("query", listCatalogItemsQuerySchema, (result) => {
      if (!result.success) {
        throw partnerErrors.invalidQuery(
          result.error.issues[0]?.message ?? "Invalid query"
        );
      }
    }),
    async (c) => {
      const venue = c.get("partnerVenue");
      const q = c.req.valid("query");
      const { items, nextCursor } = await listCatalogItems(venue.id, {
        limit: q.limit,
        cursor: q.cursor,
        isActive: q.is_active,
        externalSource: q.external_source,
        updatedSince: q.updated_since ? new Date(q.updated_since) : undefined,
      });
      return c.json({
        data: items.map(serializeCatalogItem),
        next_cursor: nextCursor,
      });
    }
  )
  /**
   * POST /catalog/items — create.
   */
  .post(
    "/",
    zValidator("json", createCatalogItemBodySchema, (result) => {
      if (!result.success) {
        throw partnerErrors.invalidPayload(
          result.error.issues[0]?.message ?? "Invalid payload",
          result.error.issues[0]?.path.join(".")
        );
      }
    }),
    async (c) => {
      const venue = c.get("partnerVenue");
      const body = c.req.valid("json");

      const result = await createCatalogItem(
        venue.id,
        {
          externalId: body.external_id,
          title: body.title,
          description: body.description ?? undefined,
          priceCents: body.price_cents ?? undefined,
          priceLabel: body.price_label ?? undefined,
          allergens: body.allergens,
          features: body.features,
          additives: body.additives,
          imageUrl: body.image_url ?? undefined,
          isActive: body.is_active,
        },
        PARTNER_SOURCE
      );

      if (!result.ok) {
        throw partnerErrors.conflict(
          result.code,
          `external_id '${body.external_id}' already used in this venue.`
        );
      }

      await emitEvent({
        venueId: venue.id,
        eventType: "catalog.item.created",
        resource: {
          type: "catalog_item",
          avo_id: result.row.id,
          external_id: result.row.externalId,
        },
        source: PARTNER_EVENT_SOURCE,
        suppress: isImportRequest(c),
      });

      return c.json(serializeCatalogItem(result.row), 201);
    }
  )
  /**
   * POST /catalog/items/bulk — upsert up to 500 at once.
   *
   * Note: the partner docs originally specified `items:bulk` (colon) but we
   * use a slash form here to keep Hono routing simple. Update docs to match.
   */
  .post(
    "/bulk",
    zValidator("json", bulkCatalogItemsBodySchema, (result) => {
      if (!result.success) {
        throw partnerErrors.invalidPayload(
          result.error.issues[0]?.message ?? "Invalid payload",
          result.error.issues[0]?.path.join(".")
        );
      }
    }),
    async (c) => {
      const venue = c.get("partnerVenue");
      const body = c.req.valid("json");

      const results = await bulkUpsertCatalogItems(
        venue.id,
        body.items.map((item) => ({
          externalId: item.external_id,
          title: item.title,
          description: item.description ?? undefined,
          priceCents: item.price_cents ?? undefined,
          priceLabel: item.price_label ?? undefined,
          allergens: item.allergens,
          features: item.features,
          additives: item.additives,
          imageUrl: item.image_url ?? undefined,
          isActive: item.is_active,
        })),
        PARTNER_SOURCE
      );

      // Emit one event per mutated item, skipped when X-Avo-Import: true.
      const suppress = isImportRequest(c);
      for (const r of results) {
        if (r.status === "unchanged") {
          continue;
        }
        await emitEvent({
          venueId: venue.id,
          eventType:
            r.status === "created"
              ? "catalog.item.created"
              : "catalog.item.updated",
          resource: {
            type: "catalog_item",
            avo_id: r.avoId,
            external_id: r.externalId,
          },
          source: PARTNER_EVENT_SOURCE,
          suppress,
        });
      }

      return c.json({
        items: results.map((r) => ({
          external_id: r.externalId,
          avo_id: r.avoId,
          status: r.status,
        })),
      });
    }
  )
  /**
   * GET /catalog/items/external/:externalId — fetch by your ID.
   */
  .get("/external/:externalId", async (c) => {
    const venue = c.get("partnerVenue");
    const externalId = c.req.param("externalId");
    const row = await getCatalogItemByExternalId(venue.id, externalId);
    if (!row) {
      throw partnerErrors.notFound("Catalog item not found.");
    }
    return c.json(serializeCatalogItem(row));
  })
  /**
   * PATCH /catalog/items/external/:externalId — update by your ID.
   */
  .patch(
    "/external/:externalId",
    zValidator("json", updateCatalogItemBodySchema, (result) => {
      if (!result.success) {
        throw partnerErrors.invalidPayload(
          result.error.issues[0]?.message ?? "Invalid payload",
          result.error.issues[0]?.path.join(".")
        );
      }
    }),
    async (c) => {
      const venue = c.get("partnerVenue");
      const externalId = c.req.param("externalId");
      const existing = await getCatalogItemByExternalId(venue.id, externalId);
      if (!existing) {
        throw partnerErrors.notFound("Catalog item not found.");
      }

      const body = c.req.valid("json");
      const updated = await updateCatalogItemRow(existing, {
        title: body.title,
        description: body.description ?? undefined,
        priceCents: body.price_cents ?? undefined,
        priceLabel: body.price_label ?? undefined,
        allergens: body.allergens,
        features: body.features,
        additives: body.additives,
        imageUrl: body.image_url ?? undefined,
        isActive: body.is_active,
      });
      await emitEvent({
        venueId: venue.id,
        eventType: "catalog.item.updated",
        resource: {
          type: "catalog_item",
          avo_id: updated.id,
          external_id: updated.externalId,
        },
        source: PARTNER_EVENT_SOURCE,
        suppress: isImportRequest(c),
      });
      return c.json(serializeCatalogItem(updated));
    }
  )
  /**
   * GET /catalog/items/:id — fetch by Avo ID.
   */
  .get("/:id", async (c) => {
    const venue = c.get("partnerVenue");
    const id = c.req.param("id");
    const row = await getCatalogItemById(venue.id, id);
    if (!row) {
      throw partnerErrors.notFound("Catalog item not found.");
    }
    return c.json(serializeCatalogItem(row));
  })
  /**
   * PATCH /catalog/items/:id — update by Avo ID.
   */
  .patch(
    "/:id",
    zValidator("json", updateCatalogItemBodySchema, (result) => {
      if (!result.success) {
        throw partnerErrors.invalidPayload(
          result.error.issues[0]?.message ?? "Invalid payload",
          result.error.issues[0]?.path.join(".")
        );
      }
    }),
    async (c) => {
      const venue = c.get("partnerVenue");
      const id = c.req.param("id");
      const existing = await getCatalogItemById(venue.id, id);
      if (!existing) {
        throw partnerErrors.notFound("Catalog item not found.");
      }
      const body = c.req.valid("json");
      const updated = await updateCatalogItemRow(existing, {
        title: body.title,
        description: body.description ?? undefined,
        priceCents: body.price_cents ?? undefined,
        priceLabel: body.price_label ?? undefined,
        allergens: body.allergens,
        features: body.features,
        additives: body.additives,
        imageUrl: body.image_url ?? undefined,
        isActive: body.is_active,
      });
      await emitEvent({
        venueId: venue.id,
        eventType: "catalog.item.updated",
        resource: {
          type: "catalog_item",
          avo_id: updated.id,
          external_id: updated.externalId,
        },
        source: PARTNER_EVENT_SOURCE,
        suppress: isImportRequest(c),
      });
      return c.json(serializeCatalogItem(updated));
    }
  )
  /**
   * DELETE /catalog/items/:id — hard delete.
   */
  .delete("/:id", async (c) => {
    const venue = c.get("partnerVenue");
    const id = c.req.param("id");
    // Capture external_id before deletion so the event still carries it.
    const existing = await getCatalogItemById(venue.id, id);
    if (!existing) {
      throw partnerErrors.notFound("Catalog item not found.");
    }
    const deleted = await deleteCatalogItemById(venue.id, id);
    if (!deleted) {
      throw partnerErrors.notFound("Catalog item not found.");
    }
    await emitEvent({
      venueId: venue.id,
      eventType: "catalog.item.deleted",
      resource: {
        type: "catalog_item",
        avo_id: id,
        external_id: existing.externalId,
      },
      source: PARTNER_EVENT_SOURCE,
      suppress: isImportRequest(c),
    });
    return c.body(null, 204);
  });
