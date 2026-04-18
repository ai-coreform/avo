import { zValidator } from "@hono/zod-validator";
import { and, asc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { z } from "zod";
import database from "@/db";
import { contentTranslation } from "@/db/schema/content-translation";
import { promotion } from "@/db/schema/promotion";
import { promotionComponent } from "@/db/schema/promotion-component";
import { promotionSchedule } from "@/db/schema/promotion-schedule";
import { requireOrgAdmin } from "@/middleware/org-admin";
import { getMenu } from "@/operations/menu/get";
import { startTranslationRun } from "@/operations/translations/job";
import { getVenueSecondaryLocaleCodes } from "@/routes/manage/locales/locales.service";
import { slugify } from "@/utils/slugify";
import { menuParamsSchema } from "../menu.schemas";
import {
  createPromoSchema,
  promoParamsSchema,
  sortPromosSchema,
  updatePromoSchema,
} from "./promos.schemas";

function validate<
  TTarget extends "json" | "param",
  TSchema extends z.ZodTypeAny,
>(target: TTarget, schema: TSchema) {
  return zValidator(target, schema, (result) => {
    if (!result.success) {
      throw result.error;
    }
  });
}

async function getPromoWithNesting(promoId: string) {
  const [promo] = await database
    .select()
    .from(promotion)
    .where(eq(promotion.id, promoId))
    .limit(1);

  if (!promo) {
    return null;
  }

  const components = await database
    .select({
      id: promotionComponent.id,
      catalogItemId: promotionComponent.catalogItemId,
      displayName: promotionComponent.displayName,
      quantity: promotionComponent.quantity,
      sortOrder: promotionComponent.sortOrder,
    })
    .from(promotionComponent)
    .where(eq(promotionComponent.promotionId, promoId))
    .orderBy(asc(promotionComponent.sortOrder));

  const schedules = await database
    .select({
      id: promotionSchedule.id,
      weekday: promotionSchedule.weekday,
      startTime: promotionSchedule.startTime,
      endTime: promotionSchedule.endTime,
      startDate: promotionSchedule.startDate,
      endDate: promotionSchedule.endDate,
      timezone: promotionSchedule.timezone,
      isActive: promotionSchedule.isActive,
    })
    .from(promotionSchedule)
    .where(eq(promotionSchedule.promotionId, promoId));

  const translationsMap = await getPromoTranslations([promoId]);

  return {
    id: promo.id,
    slug: promo.slug,
    title: promo.title,
    shortDescription: promo.shortDescription,
    longDescription: promo.longDescription,
    promoPrice: promo.promoPrice,
    originalPrice: promo.originalPrice,
    imageUrl: promo.imageUrl,
    badgeLabel: promo.badgeLabel,
    isActive: promo.isActive,
    sortOrder: promo.sortOrder,
    components,
    schedules,
    translations: translationsMap.get(promoId) ?? {},
  };
}

async function generateUniqueSlug(menuId: string, title: string) {
  const baseSlug = slugify(title) || "promo";
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const [existing] = await database
      .select({ id: promotion.id })
      .from(promotion)
      .where(and(eq(promotion.menuId, menuId), eq(promotion.slug, slug)))
      .limit(1);

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

const SOURCE_LOCALE = "it";

type TranslationsInput = Record<
  string,
  { title: string | null; description: string | null }
>;

async function savePromoTranslations(
  venueId: string,
  promoId: string,
  translations: TranslationsInput
) {
  // Delete existing translations for this promo
  await database
    .delete(contentTranslation)
    .where(
      and(
        eq(contentTranslation.entityType, "promotion"),
        eq(contentTranslation.entityId, promoId)
      )
    );

  const inserts = Object.entries(translations).flatMap(([locale, fields]) => {
    if (locale === SOURCE_LOCALE) {
      return [];
    }
    const title = fields.title?.trim() || null;
    const description = fields.description?.trim() || null;
    if (!(title || description)) {
      return [];
    }
    return [
      {
        venueId,
        entityType: "promotion" as const,
        entityId: promoId,
        locale,
        fieldsJson: { title, description },
        sourceLocale: SOURCE_LOCALE,
        sourceRevision: 1,
        status: "published" as const,
        translatedBy: "manual" as const,
      },
    ];
  });

  if (inserts.length > 0) {
    await database.insert(contentTranslation).values(inserts);
  }
}

async function getPromoTranslations(promoIds: string[]) {
  if (promoIds.length === 0) {
    return new Map<
      string,
      Record<string, { title: string | null; description: string | null }>
    >();
  }

  const rows = await database
    .select({
      entityId: contentTranslation.entityId,
      locale: contentTranslation.locale,
      fieldsJson: contentTranslation.fieldsJson,
    })
    .from(contentTranslation)
    .where(
      and(
        eq(contentTranslation.entityType, "promotion"),
        inArray(contentTranslation.entityId, promoIds)
      )
    );

  const map = new Map<
    string,
    Record<string, { title: string | null; description: string | null }>
  >();

  for (const row of rows) {
    if (row.locale === SOURCE_LOCALE) {
      continue;
    }
    const current = map.get(row.entityId) ?? {};
    current[row.locale] = {
      title: (row.fieldsJson as Record<string, string | null>).title ?? null,
      description:
        (row.fieldsJson as Record<string, string | null>).description ?? null,
    };
    map.set(row.entityId, current);
  }

  return map;
}

function triggerAutoTranslation(venueId: string) {
  getVenueSecondaryLocaleCodes(venueId)
    .then((secondaryLocales) => {
      if (secondaryLocales.length > 0) {
        return startTranslationRun(venueId, {
          locales: secondaryLocales,
          missingOnly: true,
        });
      }
      return null;
    })
    .catch(() => {
      // Intentionally swallowed — fire-and-forget translation
    });
}

const promosRoutes = new Hono()
  .use(requireOrgAdmin())

  // LIST
  .get("/", validate("param", menuParamsSchema), async (c) => {
    const member = c.get("member");
    const params = c.req.valid("param");
    const selectedMenu = await getMenu({
      venueId: member.venueId,
      menuSlug: params.menuSlug,
    });

    const promos = await database
      .select()
      .from(promotion)
      .where(eq(promotion.menuId, selectedMenu.id))
      .orderBy(asc(promotion.sortOrder), asc(promotion.createdAt));

    const promoIds = promos.map((p) => p.id);

    const components =
      promoIds.length > 0
        ? await database
            .select({
              id: promotionComponent.id,
              promotionId: promotionComponent.promotionId,
              catalogItemId: promotionComponent.catalogItemId,
              displayName: promotionComponent.displayName,
              quantity: promotionComponent.quantity,
              sortOrder: promotionComponent.sortOrder,
            })
            .from(promotionComponent)
            .where(inArray(promotionComponent.promotionId, promoIds))
            .orderBy(asc(promotionComponent.sortOrder))
        : [];

    const schedules =
      promoIds.length > 0
        ? await database
            .select({
              id: promotionSchedule.id,
              promotionId: promotionSchedule.promotionId,
              weekday: promotionSchedule.weekday,
              startTime: promotionSchedule.startTime,
              endTime: promotionSchedule.endTime,
              startDate: promotionSchedule.startDate,
              endDate: promotionSchedule.endDate,
              timezone: promotionSchedule.timezone,
              isActive: promotionSchedule.isActive,
            })
            .from(promotionSchedule)
            .where(inArray(promotionSchedule.promotionId, promoIds))
        : [];

    const componentsByPromoId = new Map<
      string,
      (typeof components)[number][]
    >();
    for (const comp of components) {
      const existing = componentsByPromoId.get(comp.promotionId);
      if (existing) {
        existing.push(comp);
      } else {
        componentsByPromoId.set(comp.promotionId, [comp]);
      }
    }

    const schedulesByPromoId = new Map<string, (typeof schedules)[number][]>();
    for (const sched of schedules) {
      const existing = schedulesByPromoId.get(sched.promotionId);
      if (existing) {
        existing.push(sched);
      } else {
        schedulesByPromoId.set(sched.promotionId, [sched]);
      }
    }

    const translationsMap = await getPromoTranslations(promoIds);

    const data = promos.map((promo) => ({
      id: promo.id,
      slug: promo.slug,
      title: promo.title,
      shortDescription: promo.shortDescription,
      longDescription: promo.longDescription,
      promoPrice: promo.promoPrice,
      originalPrice: promo.originalPrice,
      imageUrl: promo.imageUrl,
      badgeLabel: promo.badgeLabel,
      isActive: promo.isActive,
      sortOrder: promo.sortOrder,
      components: (componentsByPromoId.get(promo.id) ?? []).map(
        ({ promotionId: _, ...rest }) => rest
      ),
      schedules: (schedulesByPromoId.get(promo.id) ?? []).map(
        ({ promotionId: _, ...rest }) => rest
      ),
      translations: translationsMap.get(promo.id) ?? {},
    }));

    return c.json({ data });
  })

  // CREATE
  .post(
    "/",
    validate("param", menuParamsSchema),
    validate("json", createPromoSchema),
    async (c) => {
      const member = c.get("member");
      const params = c.req.valid("param");
      const body = c.req.valid("json");

      const selectedMenu = await getMenu({
        venueId: member.venueId,
        menuSlug: params.menuSlug,
      });

      const slug = await generateUniqueSlug(selectedMenu.id, body.title);

      const [created] = await database
        .insert(promotion)
        .values({
          menuId: selectedMenu.id,
          slug,
          title: body.title,
          shortDescription: body.shortDescription,
          longDescription: body.longDescription,
          promoPrice: body.promoPrice,
          originalPrice: body.originalPrice,
          imageUrl: body.imageUrl,
          badgeLabel: body.badgeLabel,
          isActive: body.isActive,
        })
        .returning({ id: promotion.id });

      if (!created) {
        throw new HTTPException(500, { message: "Failed to create promotion" });
      }

      if (body.components.length > 0) {
        await database.insert(promotionComponent).values(
          body.components.map((comp, index) => ({
            promotionId: created.id,
            catalogItemId: comp.catalogItemId,
            displayName: comp.displayName,
            quantity: comp.quantity,
            sortOrder: index,
          }))
        );
      }

      if (body.schedules.length > 0) {
        await database.insert(promotionSchedule).values(
          body.schedules.map((sched) => ({
            promotionId: created.id,
            weekday: sched.weekday,
            startTime: sched.startTime,
            endTime: sched.endTime,
            startDate: sched.startDate,
            endDate: sched.endDate,
            timezone: sched.timezone,
            isActive: sched.isActive,
          }))
        );
      }

      if (body.translations) {
        await savePromoTranslations(
          member.venueId,
          created.id,
          body.translations
        );
      }

      triggerAutoTranslation(member.venueId);

      const result = await getPromoWithNesting(created.id);
      return c.json({ data: result }, 201);
    }
  )

  // UPDATE
  .patch(
    "/:promoId",
    validate("param", promoParamsSchema),
    validate("json", updatePromoSchema),
    async (c) => {
      const member = c.get("member");
      const params = c.req.valid("param");
      const body = c.req.valid("json");

      const selectedMenu = await getMenu({
        venueId: member.venueId,
        menuSlug: params.menuSlug,
      });

      const [existing] = await database
        .select({ id: promotion.id })
        .from(promotion)
        .where(
          and(
            eq(promotion.id, params.promoId),
            eq(promotion.menuId, selectedMenu.id)
          )
        )
        .limit(1);

      if (!existing) {
        throw new HTTPException(404, { message: "Promotion not found" });
      }

      const updateFields: Record<string, unknown> = {};
      if (body.title !== undefined) {
        updateFields.title = body.title;
        updateFields.slug = await generateUniqueSlug(
          selectedMenu.id,
          body.title
        );
      }
      if (body.shortDescription !== undefined) {
        updateFields.shortDescription = body.shortDescription;
      }
      if (body.longDescription !== undefined) {
        updateFields.longDescription = body.longDescription;
      }
      if (body.promoPrice !== undefined) {
        updateFields.promoPrice = body.promoPrice;
      }
      if (body.originalPrice !== undefined) {
        updateFields.originalPrice = body.originalPrice;
      }
      if (body.imageUrl !== undefined) {
        updateFields.imageUrl = body.imageUrl;
      }
      if (body.badgeLabel !== undefined) {
        updateFields.badgeLabel = body.badgeLabel;
      }
      if (body.isActive !== undefined) {
        updateFields.isActive = body.isActive;
      }

      if (Object.keys(updateFields).length > 0) {
        await database
          .update(promotion)
          .set(updateFields)
          .where(eq(promotion.id, params.promoId));
      }

      if (body.components !== undefined) {
        await database
          .delete(promotionComponent)
          .where(eq(promotionComponent.promotionId, params.promoId));

        if (body.components.length > 0) {
          await database.insert(promotionComponent).values(
            body.components.map((comp, index) => ({
              promotionId: params.promoId,
              catalogItemId: comp.catalogItemId,
              displayName: comp.displayName,
              quantity: comp.quantity,
              sortOrder: index,
            }))
          );
        }
      }

      if (body.schedules !== undefined) {
        await database
          .delete(promotionSchedule)
          .where(eq(promotionSchedule.promotionId, params.promoId));

        if (body.schedules.length > 0) {
          await database.insert(promotionSchedule).values(
            body.schedules.map((sched) => ({
              promotionId: params.promoId,
              weekday: sched.weekday,
              startTime: sched.startTime,
              endTime: sched.endTime,
              startDate: sched.startDate,
              endDate: sched.endDate,
              timezone: sched.timezone,
              isActive: sched.isActive,
            }))
          );
        }
      }

      if (body.translations !== undefined) {
        await savePromoTranslations(
          member.venueId,
          params.promoId,
          body.translations
        );
      }

      // Trigger auto-translation when translatable fields changed
      const hasTranslatableChanges =
        body.title !== undefined ||
        body.shortDescription !== undefined ||
        body.longDescription !== undefined ||
        body.components !== undefined;
      if (hasTranslatableChanges) {
        triggerAutoTranslation(member.venueId);
      }

      const result = await getPromoWithNesting(params.promoId);
      return c.json({ data: result });
    }
  )

  // DELETE
  .delete("/:promoId", validate("param", promoParamsSchema), async (c) => {
    const member = c.get("member");
    const params = c.req.valid("param");

    const selectedMenu = await getMenu({
      venueId: member.venueId,
      menuSlug: params.menuSlug,
    });

    const [existing] = await database
      .select({ id: promotion.id })
      .from(promotion)
      .where(
        and(
          eq(promotion.id, params.promoId),
          eq(promotion.menuId, selectedMenu.id)
        )
      )
      .limit(1);

    if (!existing) {
      throw new HTTPException(404, { message: "Promotion not found" });
    }

    await database.delete(promotion).where(eq(promotion.id, params.promoId));

    return c.json({ success: true });
  })

  // SORT
  .put(
    "/sort",
    validate("param", menuParamsSchema),
    validate("json", sortPromosSchema),
    async (c) => {
      const member = c.get("member");
      const params = c.req.valid("param");
      const body = c.req.valid("json");

      const selectedMenu = await getMenu({
        venueId: member.venueId,
        menuSlug: params.menuSlug,
      });

      for (const item of body.items) {
        await database
          .update(promotion)
          .set({ sortOrder: item.sortOrder })
          .where(
            and(
              eq(promotion.id, item.id),
              eq(promotion.menuId, selectedMenu.id)
            )
          );
      }

      return c.json({ success: true });
    }
  );

export { promosRoutes };
