import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { VALID_LOCALE_CODES } from "@/data/locale-configs";
import database from "@/db";
import { contentTranslation } from "@/db/schema/content-translation";
import { requireOrgAdmin } from "@/middleware/org-admin";
import {
  addLocaleSchema,
  localeParamSchema,
  reorderLocalesSchema,
  toggleLocaleSchema,
} from "./locales.schemas";
import {
  addVenueLocale,
  getVenueLocales,
  removeVenueLocale,
  toggleVenueLocale,
  updateVenueLocaleOrder,
} from "./locales.service";

const localesRoutes = new Hono()
  .use(requireOrgAdmin())
  .get("/", async (c) => {
    const member = c.get("member");
    const locales = await getVenueLocales(member.venueId);
    return c.json({ data: locales });
  })
  .post("/", zValidator("json", addLocaleSchema), async (c) => {
    const member = c.get("member");
    const { locale } = c.req.valid("json");

    if (!VALID_LOCALE_CODES.has(locale)) {
      throw new HTTPException(400, {
        message: `Unsupported locale: ${locale}`,
      });
    }

    const inserted = await addVenueLocale(member.venueId, locale);
    return c.json({ data: inserted }, 201);
  })
  .delete("/:locale", zValidator("param", localeParamSchema), async (c) => {
    const member = c.get("member");
    const { locale } = c.req.valid("param");

    // Don't allow deleting the primary locale
    if (locale === "it") {
      throw new HTTPException(400, {
        message: "Cannot delete the primary locale",
      });
    }

    // Delete all content translations for this locale
    await database
      .delete(contentTranslation)
      .where(
        and(
          eq(contentTranslation.venueId, member.venueId),
          eq(contentTranslation.locale, locale)
        )
      );

    const deleted = await removeVenueLocale(member.venueId, locale);

    if (!deleted) {
      throw new HTTPException(404, { message: "Locale not found" });
    }

    return c.json({ success: true });
  })
  .patch("/reorder", zValidator("json", reorderLocalesSchema), async (c) => {
    const member = c.get("member");
    const { locales } = c.req.valid("json");

    await updateVenueLocaleOrder(member.venueId, locales);
    return c.json({ success: true });
  })
  .patch(
    "/:locale/toggle",
    zValidator("param", localeParamSchema),
    zValidator("json", toggleLocaleSchema),
    async (c) => {
      const member = c.get("member");
      const { locale } = c.req.valid("param");
      const { isEnabled } = c.req.valid("json");

      if (locale === "it") {
        throw new HTTPException(400, {
          message: "Cannot disable the primary locale",
        });
      }

      const updated = await toggleVenueLocale(
        member.venueId,
        locale,
        isEnabled
      );

      if (!updated) {
        throw new HTTPException(404, { message: "Locale not found" });
      }

      return c.json({ data: updated });
    }
  );

export { localesRoutes };
