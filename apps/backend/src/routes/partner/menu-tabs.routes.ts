import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { PartnerApiError, partnerErrors } from "@/lib/errors/partner-api-error";
import {
  requireVenueIdMatch,
  requireVenueLink,
} from "@/middleware/partner-auth";
import {
  createMenuTab,
  deleteMenuTabById,
  getMenuTabByExternalId,
  getMenuTabById,
  listMenuTabs,
  updateMenuTabRow,
} from "@/operations/partner/menu-tabs";
import { assertMenuBelongsToVenue } from "@/operations/partner/menus";
import { serializeMenuTab } from "@/operations/partner/shared/serializers";
import { emitEvent } from "@/operations/partner/webhooks/events";
import { PARTNER_SOURCE } from "./common.schemas";
import {
  createMenuTabBodySchema,
  updateMenuTabBodySchema,
} from "./menu-tabs.schemas";

const PARTNER_EVENT_SOURCE = `partner:${PARTNER_SOURCE}`;

function isImportRequest(c: {
  req: { header: (name: string) => string | undefined };
}): boolean {
  return c.req.header("X-Avo-Import") === "true";
}

/**
 * Partner API — menu tabs resource (scoped under a menu).
 * Mounted at /api/partner/venues/:venueId/menus/:menuId/tabs
 *
 * Every route requires the menu at `:menuId` to exist and belong to the
 * authenticated venue; otherwise 404 `menu_not_found`.
 */
export const menuTabsRoute = new Hono()
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
   * GET /tabs — list all tabs for this menu (ordered by sort_order).
   */
  .get("/", async (c) => {
    const menuId = c.req.param("menuId") as string;
    const rows = await listMenuTabs(menuId);
    return c.json({ data: rows.map(serializeMenuTab) });
  })
  /**
   * POST /tabs — create a tab in this menu.
   */
  .post(
    "/",
    zValidator("json", createMenuTabBodySchema, (result) => {
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

      const result = await createMenuTab(
        menuId,
        {
          externalId: body.external_id,
          label: body.title,
          isVisible: body.is_visible,
          sortOrder: body.sort_order,
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
        eventType: "menu_tab.created",
        resource: {
          type: "menu_tab",
          avo_id: result.row.id,
          external_id: result.row.externalId,
          menu_id: menuId,
        },
        source: PARTNER_EVENT_SOURCE,
        suppress: isImportRequest(c),
      });

      return c.json(serializeMenuTab(result.row), 201);
    }
  )
  /**
   * GET /tabs/external/:externalId — fetch by your ID.
   */
  .get("/external/:externalId", async (c) => {
    const menuId = c.req.param("menuId") as string;
    const externalId = c.req.param("externalId");
    const row = await getMenuTabByExternalId(menuId, externalId);
    if (!row) {
      throw new PartnerApiError(404, {
        code: "not_found",
        message: "Menu tab not found.",
      });
    }
    return c.json(serializeMenuTab(row));
  })
  /**
   * PATCH /tabs/external/:externalId — update by your ID.
   */
  .patch(
    "/external/:externalId",
    zValidator("json", updateMenuTabBodySchema, (result) => {
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
      const existing = await getMenuTabByExternalId(menuId, externalId);
      if (!existing) {
        throw new PartnerApiError(404, {
          code: "not_found",
          message: "Menu tab not found.",
        });
      }

      const body = c.req.valid("json");
      const updated = await updateMenuTabRow(existing, {
        label: body.title,
        isVisible: body.is_visible,
        sortOrder: body.sort_order,
      });
      const venue = c.get("partnerVenue");
      await emitEvent({
        venueId: venue.id,
        eventType: "menu_tab.updated",
        resource: {
          type: "menu_tab",
          avo_id: updated.id,
          external_id: updated.externalId,
          menu_id: menuId,
        },
        source: PARTNER_EVENT_SOURCE,
        suppress: isImportRequest(c),
      });
      return c.json(serializeMenuTab(updated));
    }
  )
  /**
   * GET /tabs/:tabId — fetch by Avo ID.
   */
  .get("/:tabId", async (c) => {
    const menuId = c.req.param("menuId") as string;
    const tabId = c.req.param("tabId");
    const row = await getMenuTabById(menuId, tabId);
    if (!row) {
      throw new PartnerApiError(404, {
        code: "not_found",
        message: "Menu tab not found.",
      });
    }
    return c.json(serializeMenuTab(row));
  })
  /**
   * PATCH /tabs/:tabId — update by Avo ID.
   */
  .patch(
    "/:tabId",
    zValidator("json", updateMenuTabBodySchema, (result) => {
      if (!result.success) {
        throw partnerErrors.invalidPayload(
          result.error.issues[0]?.message ?? "Invalid payload",
          result.error.issues[0]?.path.join(".")
        );
      }
    }),
    async (c) => {
      const menuId = c.req.param("menuId") as string;
      const tabId = c.req.param("tabId");
      const existing = await getMenuTabById(menuId, tabId);
      if (!existing) {
        throw new PartnerApiError(404, {
          code: "not_found",
          message: "Menu tab not found.",
        });
      }
      const body = c.req.valid("json");
      const updated = await updateMenuTabRow(existing, {
        label: body.title,
        isVisible: body.is_visible,
        sortOrder: body.sort_order,
      });
      const venue = c.get("partnerVenue");
      await emitEvent({
        venueId: venue.id,
        eventType: "menu_tab.updated",
        resource: {
          type: "menu_tab",
          avo_id: updated.id,
          external_id: updated.externalId,
          menu_id: menuId,
        },
        source: PARTNER_EVENT_SOURCE,
        suppress: isImportRequest(c),
      });
      return c.json(serializeMenuTab(updated));
    }
  )
  /**
   * DELETE /tabs/:tabId — hard delete.
   */
  .delete("/:tabId", async (c) => {
    const menuId = c.req.param("menuId") as string;
    const tabId = c.req.param("tabId");
    const existing = await getMenuTabById(menuId, tabId);
    if (!existing) {
      throw new PartnerApiError(404, {
        code: "not_found",
        message: "Menu tab not found.",
      });
    }
    const deleted = await deleteMenuTabById(menuId, tabId);
    if (!deleted) {
      throw new PartnerApiError(404, {
        code: "not_found",
        message: "Menu tab not found.",
      });
    }
    const venue = c.get("partnerVenue");
    await emitEvent({
      venueId: venue.id,
      eventType: "menu_tab.deleted",
      resource: {
        type: "menu_tab",
        avo_id: tabId,
        external_id: existing.externalId,
        menu_id: menuId,
      },
      source: PARTNER_EVENT_SOURCE,
      suppress: isImportRequest(c),
    });
    return c.body(null, 204);
  });
