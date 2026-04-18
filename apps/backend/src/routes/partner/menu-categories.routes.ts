import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { PartnerApiError, partnerErrors } from "@/lib/errors/partner-api-error";
import {
  requireVenueIdMatch,
  requireVenueLink,
} from "@/middleware/partner-auth";
import {
  createMenuCategory,
  deleteMenuCategoryById,
  getMenuCategoryByExternalId,
  getMenuCategoryById,
  listMenuCategories,
  resolveTabForMenu,
  updateMenuCategoryRow,
} from "@/operations/partner/menu-categories";
import { assertMenuBelongsToVenue } from "@/operations/partner/menus";
import { serializeMenuCategory } from "@/operations/partner/shared/serializers";
import { emitEvent } from "@/operations/partner/webhooks/events";
import { PARTNER_SOURCE } from "./common.schemas";
import {
  createMenuCategoryBodySchema,
  listMenuCategoriesQuerySchema,
  updateMenuCategoryBodySchema,
} from "./menu-categories.schemas";

const PARTNER_EVENT_SOURCE = `partner:${PARTNER_SOURCE}`;

function isImportRequest(c: {
  req: { header: (name: string) => string | undefined };
}): boolean {
  return c.req.header("X-Avo-Import") === "true";
}

/**
 * Partner API — menu categories resource (scoped under a menu).
 * Mounted at /api/partner/venues/:venueId/menus/:menuId/categories
 */
export const menuCategoriesRoute = new Hono()
  .use(requireVenueLink())
  .use(requireVenueIdMatch())
  // Validate :menuId scope for all routes.
  .use(async (c, next) => {
    const venue = c.get("partnerVenue");
    const menuId = c.req.param("menuId");
    if (!menuId) {
      throw new PartnerApiError(400, {
        code: "invalid_payload",
        message: "Missing menuId in path.",
        field: "menuId",
      });
    }
    const menuRow = await assertMenuBelongsToVenue(venue.id, menuId);
    if (!menuRow) {
      throw new PartnerApiError(404, {
        code: "menu_not_found",
        message: "Menu not found.",
      });
    }
    await next();
  })
  /**
   * GET /categories — list (optional tab_id / tab_external_id filter).
   */
  .get(
    "/",
    zValidator("query", listMenuCategoriesQuerySchema, (result) => {
      if (!result.success) {
        throw partnerErrors.invalidQuery(
          result.error.issues[0]?.message ?? "Invalid query"
        );
      }
    }),
    async (c) => {
      const menuId = c.req.param("menuId") as string;
      const q = c.req.valid("query");

      let filterTabId: string | undefined;
      if (q.tab_id) {
        filterTabId = q.tab_id;
      } else if (q.tab_external_id) {
        const tab = await resolveTabForMenu(menuId, {
          tabExternalId: q.tab_external_id,
        });
        if (!tab) {
          throw new PartnerApiError(404, {
            code: "tab_not_found",
            message: "Menu tab not found.",
          });
        }
        filterTabId = tab.id;
      }

      const rows = await listMenuCategories(menuId, { tabId: filterTabId });
      return c.json({ data: rows.map(serializeMenuCategory) });
    }
  )
  /**
   * POST /categories — create.
   */
  .post(
    "/",
    zValidator("json", createMenuCategoryBodySchema, (result) => {
      if (!result.success) {
        throw partnerErrors.invalidPayload(
          result.error.issues[0]?.message ?? "Invalid payload",
          result.error.issues[0]?.path.join(".")
        );
      }
    }),
    async (c) => {
      const menuId = c.req.param("menuId") as string;
      const body = c.req.valid("json");

      const tab = await resolveTabForMenu(menuId, {
        tabId: body.tab_id,
        tabExternalId: body.tab_external_id,
      });
      if (!tab) {
        throw new PartnerApiError(404, {
          code: "tab_not_found",
          message: "Menu tab not found.",
        });
      }

      const result = await createMenuCategory(
        menuId,
        {
          externalId: body.external_id,
          title: body.title,
          isVisible: body.is_visible,
          sortOrder: body.sort_order,
          tabId: tab.id,
        },
        PARTNER_SOURCE
      );

      if (!result.ok) {
        return c.json(
          {
            error: {
              code: result.code,
              message: `external_id '${body.external_id}' already used in this menu.`,
            },
          },
          409
        );
      }

      const venue = c.get("partnerVenue");
      await emitEvent({
        venueId: venue.id,
        eventType: "menu_category.created",
        resource: {
          type: "menu_category",
          avo_id: result.row.id,
          external_id: result.row.externalId,
          menu_id: menuId,
        },
        source: PARTNER_EVENT_SOURCE,
        suppress: isImportRequest(c),
      });

      return c.json(serializeMenuCategory(result.row), 201);
    }
  )
  /**
   * GET /categories/external/:externalId — fetch by your ID.
   */
  .get("/external/:externalId", async (c) => {
    const menuId = c.req.param("menuId") as string;
    const externalId = c.req.param("externalId");
    const row = await getMenuCategoryByExternalId(menuId, externalId);
    if (!row) {
      throw new PartnerApiError(404, {
        code: "not_found",
        message: "Menu category not found.",
      });
    }
    return c.json(serializeMenuCategory(row));
  })
  /**
   * PATCH /categories/external/:externalId — update by your ID.
   */
  .patch(
    "/external/:externalId",
    zValidator("json", updateMenuCategoryBodySchema, (result) => {
      if (!result.success) {
        throw partnerErrors.invalidPayload(
          result.error.issues[0]?.message ?? "Invalid payload",
          result.error.issues[0]?.path.join(".")
        );
      }
    }),
    async (c) => {
      const menuId = c.req.param("menuId") as string;
      const externalId = c.req.param("externalId");
      const existing = await getMenuCategoryByExternalId(menuId, externalId);
      if (!existing) {
        throw new PartnerApiError(404, {
          code: "not_found",
          message: "Menu category not found.",
        });
      }

      const body = c.req.valid("json");

      let resolvedTabId: string | undefined;
      if (body.tab_id || body.tab_external_id) {
        const tab = await resolveTabForMenu(menuId, {
          tabId: body.tab_id,
          tabExternalId: body.tab_external_id,
        });
        if (!tab) {
          throw new PartnerApiError(404, {
            code: "tab_not_found",
            message: "Menu tab not found.",
          });
        }
        resolvedTabId = tab.id;
      }

      const updated = await updateMenuCategoryRow(existing, {
        title: body.title,
        isVisible: body.is_visible,
        sortOrder: body.sort_order,
        tabId: resolvedTabId,
      });
      const venue = c.get("partnerVenue");
      await emitEvent({
        venueId: venue.id,
        eventType: "menu_category.updated",
        resource: {
          type: "menu_category",
          avo_id: updated.id,
          external_id: updated.externalId,
          menu_id: menuId,
        },
        source: PARTNER_EVENT_SOURCE,
        suppress: isImportRequest(c),
      });
      return c.json(serializeMenuCategory(updated));
    }
  )
  /**
   * GET /categories/:categoryId — fetch by Avo ID.
   */
  .get("/:categoryId", async (c) => {
    const menuId = c.req.param("menuId") as string;
    const categoryId = c.req.param("categoryId");
    const row = await getMenuCategoryById(menuId, categoryId);
    if (!row) {
      throw new PartnerApiError(404, {
        code: "not_found",
        message: "Menu category not found.",
      });
    }
    return c.json(serializeMenuCategory(row));
  })
  /**
   * PATCH /categories/:categoryId — update by Avo ID.
   */
  .patch(
    "/:categoryId",
    zValidator("json", updateMenuCategoryBodySchema, (result) => {
      if (!result.success) {
        throw partnerErrors.invalidPayload(
          result.error.issues[0]?.message ?? "Invalid payload",
          result.error.issues[0]?.path.join(".")
        );
      }
    }),
    async (c) => {
      const menuId = c.req.param("menuId") as string;
      const categoryId = c.req.param("categoryId");
      const existing = await getMenuCategoryById(menuId, categoryId);
      if (!existing) {
        throw new PartnerApiError(404, {
          code: "not_found",
          message: "Menu category not found.",
        });
      }

      const body = c.req.valid("json");

      let resolvedTabId: string | undefined;
      if (body.tab_id || body.tab_external_id) {
        const tab = await resolveTabForMenu(menuId, {
          tabId: body.tab_id,
          tabExternalId: body.tab_external_id,
        });
        if (!tab) {
          throw new PartnerApiError(404, {
            code: "tab_not_found",
            message: "Menu tab not found.",
          });
        }
        resolvedTabId = tab.id;
      }

      const updated = await updateMenuCategoryRow(existing, {
        title: body.title,
        isVisible: body.is_visible,
        sortOrder: body.sort_order,
        tabId: resolvedTabId,
      });
      const venue = c.get("partnerVenue");
      await emitEvent({
        venueId: venue.id,
        eventType: "menu_category.updated",
        resource: {
          type: "menu_category",
          avo_id: updated.id,
          external_id: updated.externalId,
          menu_id: menuId,
        },
        source: PARTNER_EVENT_SOURCE,
        suppress: isImportRequest(c),
      });
      return c.json(serializeMenuCategory(updated));
    }
  )
  /**
   * DELETE /categories/:categoryId — hard delete.
   */
  .delete("/:categoryId", async (c) => {
    const menuId = c.req.param("menuId") as string;
    const categoryId = c.req.param("categoryId");
    const existing = await getMenuCategoryById(menuId, categoryId);
    if (!existing) {
      throw new PartnerApiError(404, {
        code: "not_found",
        message: "Menu category not found.",
      });
    }
    const deleted = await deleteMenuCategoryById(menuId, categoryId);
    if (!deleted) {
      throw new PartnerApiError(404, {
        code: "not_found",
        message: "Menu category not found.",
      });
    }
    const venue = c.get("partnerVenue");
    await emitEvent({
      venueId: venue.id,
      eventType: "menu_category.deleted",
      resource: {
        type: "menu_category",
        avo_id: categoryId,
        external_id: existing.externalId,
        menu_id: menuId,
      },
      source: PARTNER_EVENT_SOURCE,
      suppress: isImportRequest(c),
    });
    return c.body(null, 204);
  });
