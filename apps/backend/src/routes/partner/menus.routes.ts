import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { PartnerApiError, partnerErrors } from "@/lib/errors/partner-api-error";
import {
  requireVenueIdMatch,
  requireVenueLink,
} from "@/middleware/partner-auth";
import {
  createMenu,
  deleteMenuById,
  getMenuByExternalId,
  getMenuById,
  listMenus,
  updateMenuRow,
} from "@/operations/partner/menus";
import { serializeMenu } from "@/operations/partner/shared/serializers";
import { emitEvent } from "@/operations/partner/webhooks/events";
import { PARTNER_SOURCE } from "./common.schemas";
import {
  createMenuBodySchema,
  listMenusQuerySchema,
  updateMenuBodySchema,
} from "./menus.schemas";

const PARTNER_EVENT_SOURCE = `partner:${PARTNER_SOURCE}`;

function isImportRequest(c: {
  req: { header: (name: string) => string | undefined };
}): boolean {
  return c.req.header("X-Avo-Import") === "true";
}

/**
 * Partner API — menus resource.
 * Mounted at /api/partner/venues/:venueId/menus
 */
export const menusRoute = new Hono()
  .use(requireVenueLink())
  .use(requireVenueIdMatch())
  /**
   * GET /menus — list, paginated.
   */
  .get(
    "/",
    zValidator("query", listMenusQuerySchema, (result) => {
      if (!result.success) {
        throw partnerErrors.invalidQuery(
          result.error.issues[0]?.message ?? "Invalid query"
        );
      }
    }),
    async (c) => {
      const venue = c.get("partnerVenue");
      const q = c.req.valid("query");
      const { items, nextCursor } = await listMenus(venue.id, {
        limit: q.limit,
        cursor: q.cursor,
        status: q.status,
        externalSource: q.external_source,
        updatedSince: q.updated_since ? new Date(q.updated_since) : undefined,
      });
      return c.json({
        data: items.map(serializeMenu),
        next_cursor: nextCursor,
      });
    }
  )
  /**
   * POST /menus — create.
   */
  .post(
    "/",
    zValidator("json", createMenuBodySchema, (result) => {
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

      const result = await createMenu(
        venue.id,
        {
          externalId: body.external_id,
          name: body.title,
          status: body.status,
          sortOrder: body.sort_order,
        },
        PARTNER_SOURCE
      );

      if (!result.ok) {
        return c.json(
          {
            error: {
              code: result.code,
              message: `external_id '${body.external_id}' already used in this venue.`,
            },
          },
          409
        );
      }

      await emitEvent({
        venueId: venue.id,
        eventType: "menu.created",
        resource: {
          type: "menu",
          avo_id: result.row.id,
          external_id: result.row.externalId,
        },
        source: PARTNER_EVENT_SOURCE,
        suppress: isImportRequest(c),
      });

      return c.json(serializeMenu(result.row), 201);
    }
  )
  /**
   * GET /menus/external/:externalId — fetch by your ID.
   */
  .get("/external/:externalId", async (c) => {
    const venue = c.get("partnerVenue");
    const externalId = c.req.param("externalId");
    const row = await getMenuByExternalId(venue.id, externalId);
    if (!row) {
      throw new PartnerApiError(404, {
        code: "not_found",
        message: "Menu not found.",
      });
    }
    return c.json(serializeMenu(row));
  })
  /**
   * PATCH /menus/external/:externalId — update by your ID.
   */
  .patch(
    "/external/:externalId",
    zValidator("json", updateMenuBodySchema, (result) => {
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
      const existing = await getMenuByExternalId(venue.id, externalId);
      if (!existing) {
        throw new PartnerApiError(404, {
          code: "not_found",
          message: "Menu not found.",
        });
      }

      const body = c.req.valid("json");
      const updated = await updateMenuRow(existing, {
        name: body.title,
        status: body.status,
        sortOrder: body.sort_order,
      });
      await emitEvent({
        venueId: venue.id,
        eventType: "menu.updated",
        resource: {
          type: "menu",
          avo_id: updated.id,
          external_id: updated.externalId,
        },
        source: PARTNER_EVENT_SOURCE,
        suppress: isImportRequest(c),
      });
      return c.json(serializeMenu(updated));
    }
  )
  /**
   * GET /menus/:id — fetch by Avo ID.
   */
  .get("/:id", async (c) => {
    const venue = c.get("partnerVenue");
    const id = c.req.param("id");
    const row = await getMenuById(venue.id, id);
    if (!row) {
      throw new PartnerApiError(404, {
        code: "not_found",
        message: "Menu not found.",
      });
    }
    return c.json(serializeMenu(row));
  })
  /**
   * PATCH /menus/:id — update by Avo ID.
   */
  .patch(
    "/:id",
    zValidator("json", updateMenuBodySchema, (result) => {
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
      const existing = await getMenuById(venue.id, id);
      if (!existing) {
        throw new PartnerApiError(404, {
          code: "not_found",
          message: "Menu not found.",
        });
      }
      const body = c.req.valid("json");
      const updated = await updateMenuRow(existing, {
        name: body.title,
        status: body.status,
        sortOrder: body.sort_order,
      });
      await emitEvent({
        venueId: venue.id,
        eventType: "menu.updated",
        resource: {
          type: "menu",
          avo_id: updated.id,
          external_id: updated.externalId,
        },
        source: PARTNER_EVENT_SOURCE,
        suppress: isImportRequest(c),
      });
      return c.json(serializeMenu(updated));
    }
  )
  /**
   * DELETE /menus/:id — hard delete.
   */
  .delete("/:id", async (c) => {
    const venue = c.get("partnerVenue");
    const id = c.req.param("id");
    const existing = await getMenuById(venue.id, id);
    if (!existing) {
      throw new PartnerApiError(404, {
        code: "not_found",
        message: "Menu not found.",
      });
    }
    const deleted = await deleteMenuById(venue.id, id);
    if (!deleted) {
      throw new PartnerApiError(404, {
        code: "not_found",
        message: "Menu not found.",
      });
    }
    await emitEvent({
      venueId: venue.id,
      eventType: "menu.deleted",
      resource: {
        type: "menu",
        avo_id: id,
        external_id: existing.externalId,
      },
      source: PARTNER_EVENT_SOURCE,
      suppress: isImportRequest(c),
    });
    return c.body(null, 204);
  });
