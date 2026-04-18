import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { catalogItem } from "@/db/schema/catalog-item";
import type { menuCategory } from "@/db/schema/menu-category";
import { PartnerApiError, partnerErrors } from "@/lib/errors/partner-api-error";
import {
  requireVenueIdMatch,
  requireVenueLink,
} from "@/middleware/partner-auth";
import {
  createMenuEntry,
  deleteMenuEntryById,
  getCatalogItemByExternalIdScoped,
  getCatalogItemScoped,
  getCategoryByExternalId,
  getCategoryForMenu,
  getMenuEntryByExternalId,
  getMenuEntryById,
  listMenuEntries,
  updateMenuEntryRow,
} from "@/operations/partner/menu-entries";
import { assertMenuBelongsToVenue } from "@/operations/partner/menus";
import { serializeMenuEntry } from "@/operations/partner/shared/serializers";
import { emitEvent } from "@/operations/partner/webhooks/events";
import { PARTNER_SOURCE } from "./common.schemas";
import {
  createMenuEntryBodySchema,
  listMenuEntriesQuerySchema,
  updateMenuEntryBodySchema,
} from "./menu-entries.schemas";

const PARTNER_EVENT_SOURCE = `partner:${PARTNER_SOURCE}`;

function isImportRequest(c: {
  req: { header: (name: string) => string | undefined };
}): boolean {
  return c.req.header("X-Avo-Import") === "true";
}

/**
 * Partner API — menu entries.
 * Mounted at /api/partner/venues/:venueId/menus/:menuId/entries
 *
 * Middleware stack:
 * 1. requireVenueLink — validates X-Avo-Venue-Link.
 * 2. requireVenueIdMatch — ensures :venueId path param matches the linked venue.
 * 3. Scoped check — :menuId must exist and belong to this venue.
 */
export const menuEntriesRoute = new Hono()
  .use(requireVenueLink())
  .use(requireVenueIdMatch())
  .use(async (c, next) => {
    const venue = c.get("partnerVenue");
    const menuId = c.req.param("menuId");
    if (!menuId) {
      throw new PartnerApiError(400, {
        code: "invalid_path",
        message: "menuId path parameter is required.",
      });
    }
    const menu = await assertMenuBelongsToVenue(venue.id, menuId);
    if (!menu) {
      throw new PartnerApiError(404, {
        code: "menu_not_found",
        message: "Menu not found in this venue.",
      });
    }
    await next();
  })
  /**
   * GET /entries
   */
  .get(
    "/",
    zValidator("query", listMenuEntriesQuerySchema, (result) => {
      if (!result.success) {
        throw partnerErrors.invalidQuery(
          result.error.issues[0]?.message ?? "Invalid query"
        );
      }
    }),
    async (c) => {
      const menuId = c.req.param("menuId") ?? "";
      const q = c.req.valid("query");

      let categoryFilter = q.category_id;
      if (q.category_external_id) {
        const resolved = await getCategoryByExternalId(
          menuId,
          q.category_external_id
        );
        if (!resolved) {
          throw new PartnerApiError(404, {
            code: "category_not_found",
            message: "Category not found in this menu.",
          });
        }
        categoryFilter = resolved.id;
      }

      const { items, nextCursor } = await listMenuEntries(menuId, {
        limit: q.limit,
        cursor: q.cursor,
        categoryId: categoryFilter,
        externalSource: q.external_source,
        updatedSince: q.updated_since ? new Date(q.updated_since) : undefined,
      });
      return c.json({
        data: items.map(serializeMenuEntry),
        next_cursor: nextCursor,
      });
    }
  )
  /**
   * POST /entries
   */
  .post(
    "/",
    zValidator("json", createMenuEntryBodySchema, (result) => {
      if (!result.success) {
        throw partnerErrors.invalidPayload(
          result.error.issues[0]?.message ?? "Invalid payload",
          result.error.issues[0]?.path.join(".")
        );
      }
    }),
    async (c) => {
      const venue = c.get("partnerVenue");
      const menuId = c.req.param("menuId") ?? "";
      const body = c.req.valid("json");

      // Resolve category.
      let category: typeof menuCategory.$inferSelect | null = null;
      if (body.category_id) {
        category = await getCategoryForMenu(menuId, body.category_id);
      } else if (body.category_external_id) {
        category = await getCategoryByExternalId(
          menuId,
          body.category_external_id
        );
      }
      if (!category) {
        throw new PartnerApiError(404, {
          code: "category_not_found",
          message: "Category not found in this menu.",
        });
      }

      const kind = body.kind ?? "entry";
      const catalogResolution = await resolveCatalogItemForEntry(
        venue.id,
        kind,
        body.catalog_item_id ?? undefined,
        body.catalog_item_external_id ?? undefined
      );
      if (catalogResolution.kind === "error") {
        return c.json(
          {
            error: {
              code: catalogResolution.code,
              message: catalogResolution.message,
            },
          },
          catalogResolution.status
        );
      }
      const catalogItemId = catalogResolution.id;

      const result = await createMenuEntry(menuId, {
        externalId: body.external_id,
        kind,
        title: body.title ?? null,
        categoryId: category.id,
        catalogItemId,
        sortOrder: body.sort_order,
        isVisible: body.is_visible,
        priceCentsOverride: body.price_cents_override ?? undefined,
        priceLabelOverride: body.price_label_override ?? undefined,
      });

      if (!result.ok) {
        if (result.code === "external_id_conflict") {
          return c.json(
            {
              error: {
                code: "external_id_conflict",
                message: `external_id '${body.external_id}' already used in this menu.`,
              },
            },
            409
          );
        }
        return c.json(
          {
            error: {
              code: result.code,
              message: result.message,
            },
          },
          400
        );
      }

      await emitEvent({
        venueId: venue.id,
        eventType: "menu_entry.created",
        resource: {
          type: "menu_entry",
          avo_id: result.row.id,
          external_id: result.row.externalId,
          menu_id: menuId,
        },
        source: PARTNER_EVENT_SOURCE,
        suppress: isImportRequest(c),
      });

      return c.json(serializeMenuEntry(result.row), 201);
    }
  )
  /**
   * GET /entries/external/:externalId
   */
  .get("/external/:externalId", async (c) => {
    const menuId = c.req.param("menuId") ?? "";
    const externalId = c.req.param("externalId") ?? "";
    const row = await getMenuEntryByExternalId(menuId, externalId);
    if (!row) {
      throw new PartnerApiError(404, {
        code: "not_found",
        message: "Menu entry not found.",
      });
    }
    return c.json(serializeMenuEntry(row));
  })
  /**
   * PATCH /entries/external/:externalId
   */
  .patch(
    "/external/:externalId",
    zValidator("json", updateMenuEntryBodySchema, (result) => {
      if (!result.success) {
        throw partnerErrors.invalidPayload(
          result.error.issues[0]?.message ?? "Invalid payload",
          result.error.issues[0]?.path.join(".")
        );
      }
    }),
    async (c) => {
      const menuId = c.req.param("menuId") ?? "";
      const externalId = c.req.param("externalId") ?? "";
      const existing = await getMenuEntryByExternalId(menuId, externalId);
      if (!existing) {
        throw new PartnerApiError(404, {
          code: "not_found",
          message: "Menu entry not found.",
        });
      }
      const body = c.req.valid("json");

      let nextCategoryId: string | undefined;
      if (body.category_id) {
        const cat = await getCategoryForMenu(menuId, body.category_id);
        if (!cat) {
          throw new PartnerApiError(404, {
            code: "category_not_found",
            message: "Target category not found in this menu.",
          });
        }
        nextCategoryId = cat.id;
      } else if (body.category_external_id) {
        const cat = await getCategoryByExternalId(
          menuId,
          body.category_external_id
        );
        if (!cat) {
          throw new PartnerApiError(404, {
            code: "category_not_found",
            message: "Target category not found in this menu.",
          });
        }
        nextCategoryId = cat.id;
      }

      const updated = await updateMenuEntryRow(existing, {
        title: body.title ?? undefined,
        sortOrder: body.sort_order,
        isVisible: body.is_visible,
        priceCentsOverride: body.price_cents_override ?? undefined,
        priceLabelOverride: body.price_label_override ?? undefined,
        categoryId: nextCategoryId,
      });
      const venue = c.get("partnerVenue");
      await emitEvent({
        venueId: venue.id,
        eventType: "menu_entry.updated",
        resource: {
          type: "menu_entry",
          avo_id: updated.id,
          external_id: updated.externalId,
          menu_id: menuId,
        },
        source: PARTNER_EVENT_SOURCE,
        suppress: isImportRequest(c),
      });
      return c.json(serializeMenuEntry(updated));
    }
  )
  /**
   * GET /entries/:id
   */
  .get("/:id", async (c) => {
    const menuId = c.req.param("menuId") ?? "";
    const id = c.req.param("id") ?? "";
    const row = await getMenuEntryById(menuId, id);
    if (!row) {
      throw new PartnerApiError(404, {
        code: "not_found",
        message: "Menu entry not found.",
      });
    }
    return c.json(serializeMenuEntry(row));
  })
  /**
   * PATCH /entries/:id
   */
  .patch(
    "/:id",
    zValidator("json", updateMenuEntryBodySchema, (result) => {
      if (!result.success) {
        throw partnerErrors.invalidPayload(
          result.error.issues[0]?.message ?? "Invalid payload",
          result.error.issues[0]?.path.join(".")
        );
      }
    }),
    async (c) => {
      const menuId = c.req.param("menuId") ?? "";
      const id = c.req.param("id") ?? "";
      const existing = await getMenuEntryById(menuId, id);
      if (!existing) {
        throw new PartnerApiError(404, {
          code: "not_found",
          message: "Menu entry not found.",
        });
      }
      const body = c.req.valid("json");

      let nextCategoryId: string | undefined;
      if (body.category_id) {
        const cat = await getCategoryForMenu(menuId, body.category_id);
        if (!cat) {
          throw new PartnerApiError(404, {
            code: "category_not_found",
            message: "Target category not found in this menu.",
          });
        }
        nextCategoryId = cat.id;
      } else if (body.category_external_id) {
        const cat = await getCategoryByExternalId(
          menuId,
          body.category_external_id
        );
        if (!cat) {
          throw new PartnerApiError(404, {
            code: "category_not_found",
            message: "Target category not found in this menu.",
          });
        }
        nextCategoryId = cat.id;
      }

      const updated = await updateMenuEntryRow(existing, {
        title: body.title ?? undefined,
        sortOrder: body.sort_order,
        isVisible: body.is_visible,
        priceCentsOverride: body.price_cents_override ?? undefined,
        priceLabelOverride: body.price_label_override ?? undefined,
        categoryId: nextCategoryId,
      });
      const venue = c.get("partnerVenue");
      await emitEvent({
        venueId: venue.id,
        eventType: "menu_entry.updated",
        resource: {
          type: "menu_entry",
          avo_id: updated.id,
          external_id: updated.externalId,
          menu_id: menuId,
        },
        source: PARTNER_EVENT_SOURCE,
        suppress: isImportRequest(c),
      });
      return c.json(serializeMenuEntry(updated));
    }
  )
  /**
   * DELETE /entries/:id
   */
  .delete("/:id", async (c) => {
    const menuId = c.req.param("menuId") ?? "";
    const id = c.req.param("id") ?? "";
    const existing = await getMenuEntryById(menuId, id);
    if (!existing) {
      throw new PartnerApiError(404, {
        code: "not_found",
        message: "Menu entry not found.",
      });
    }
    const deleted = await deleteMenuEntryById(menuId, id);
    if (!deleted) {
      throw new PartnerApiError(404, {
        code: "not_found",
        message: "Menu entry not found.",
      });
    }
    const venue = c.get("partnerVenue");
    await emitEvent({
      venueId: venue.id,
      eventType: "menu_entry.deleted",
      resource: {
        type: "menu_entry",
        avo_id: id,
        external_id: existing.externalId,
        menu_id: menuId,
      },
      source: PARTNER_EVENT_SOURCE,
      suppress: isImportRequest(c),
    });
    return c.body(null, 204);
  });

/** Private helpers kept below to keep the builder chain readable. */

type CatalogResolution =
  | { kind: "ok"; id: string | null }
  | {
      kind: "error";
      status: 400 | 404;
      code: string;
      message: string;
    };

async function resolveCatalogItemForEntry(
  venueId: string,
  entryKind: "entry" | "group",
  catalogItemId: string | null | undefined,
  catalogItemExternalId: string | null | undefined
): Promise<CatalogResolution> {
  if (entryKind !== "entry") {
    return { kind: "ok", id: null };
  }

  let row: typeof catalogItem.$inferSelect | null = null;
  if (catalogItemId) {
    row = await getCatalogItemScoped(venueId, catalogItemId);
  } else if (catalogItemExternalId) {
    row = await getCatalogItemByExternalIdScoped(
      venueId,
      catalogItemExternalId
    );
  } else {
    return {
      kind: "error",
      status: 400,
      code: "invalid_payload",
      message:
        "kind='entry' requires catalog_item_id or catalog_item_external_id.",
    };
  }

  if (!row) {
    return {
      kind: "error",
      status: 404,
      code: "catalog_item_not_found",
      message: "Catalog item not found in this venue.",
    };
  }

  return { kind: "ok", id: row.id };
}
