import { and, asc, eq, inArray } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import database from "@/db";
import { venue } from "@/db/schema/auth/venue";
import { catalogItem } from "@/db/schema/catalog-item";
import { contentTranslation } from "@/db/schema/content-translation";
import { menu } from "@/db/schema/menu";
import { menuCategory } from "@/db/schema/menu-category";
import { menuEntry } from "@/db/schema/menu-entry";
import { menuTab } from "@/db/schema/menu-tab";
import { promotion } from "@/db/schema/promotion";
import { promotionComponent } from "@/db/schema/promotion-component";
import { promotionSchedule } from "@/db/schema/promotion-schedule";
import { venueLocale } from "@/db/schema/venue-locale";
import { serializePublicMenu } from "./shared";

export async function getFullMenu(venueSlug: string, menuSlug: string) {
  const [venueRow] = await database
    .select()
    .from(venue)
    .where(eq(venue.slug, venueSlug))
    .limit(1);

  if (!venueRow) {
    throw new HTTPException(404, { message: "Venue not found" });
  }

  const [publishedMenu] = await database
    .select()
    .from(menu)
    .where(
      and(
        eq(menu.venueId, venueRow.id),
        eq(menu.slug, menuSlug),
        eq(menu.status, "published")
      )
    )
    .limit(1);

  if (!publishedMenu) {
    throw new HTTPException(404, { message: "Menu not found" });
  }

  const tabRows = await database
    .select()
    .from(menuTab)
    .where(
      and(eq(menuTab.menuId, publishedMenu.id), eq(menuTab.isVisible, true))
    )
    .orderBy(asc(menuTab.sortOrder), asc(menuTab.createdAt));

  const categoryRows = await database
    .select()
    .from(menuCategory)
    .where(
      and(
        eq(menuCategory.menuId, publishedMenu.id),
        eq(menuCategory.isVisible, true)
      )
    )
    .orderBy(asc(menuCategory.sortOrder), asc(menuCategory.createdAt));

  const categoryIds = categoryRows.map((c) => c.id);

  const entryRows =
    categoryIds.length > 0
      ? await database
          .select({
            id: menuEntry.id,
            categoryId: menuEntry.categoryId,
            kind: menuEntry.kind,
            rowTitle: menuEntry.title,
            sortOrder: menuEntry.sortOrder,
            isVisible: menuEntry.isVisible,
            priceCentsOverride: menuEntry.priceCentsOverride,
            priceLabelOverride: menuEntry.priceLabelOverride,
            catalogItemId: catalogItem.id,
            title: catalogItem.title,
            description: catalogItem.description,
            priceCents: catalogItem.priceCents,
            priceLabel: catalogItem.priceLabel,
            allergens: catalogItem.allergens,
            features: catalogItem.features,
            additives: catalogItem.additives,
            imageUrl: catalogItem.imageUrl,
          })
          .from(menuEntry)
          .leftJoin(catalogItem, eq(menuEntry.catalogItemId, catalogItem.id))
          .where(
            and(
              eq(menuEntry.menuId, publishedMenu.id),
              eq(menuEntry.isVisible, true)
            )
          )
          .orderBy(asc(menuEntry.sortOrder), asc(menuEntry.createdAt))
      : [];

  // Promotions
  const promotionRows = await database
    .select()
    .from(promotion)
    .where(
      and(eq(promotion.menuId, publishedMenu.id), eq(promotion.isActive, true))
    )
    .orderBy(asc(promotion.sortOrder), asc(promotion.createdAt));

  const promotionIds = promotionRows.map((p) => p.id);

  const componentRows =
    promotionIds.length > 0
      ? await database
          .select({
            id: promotionComponent.id,
            promotionId: promotionComponent.promotionId,
            displayName: promotionComponent.displayName,
            quantity: promotionComponent.quantity,
            sortOrder: promotionComponent.sortOrder,
          })
          .from(promotionComponent)
          .where(inArray(promotionComponent.promotionId, promotionIds))
          .orderBy(
            asc(promotionComponent.sortOrder),
            asc(promotionComponent.createdAt)
          )
      : [];

  const scheduleRows =
    promotionIds.length > 0
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
          .where(
            and(
              inArray(promotionSchedule.promotionId, promotionIds),
              eq(promotionSchedule.isActive, true)
            )
          )
      : [];

  // Venue locales
  const localeRows = await database
    .select({
      locale: venueLocale.locale,
      isEnabled: venueLocale.isEnabled,
    })
    .from(venueLocale)
    .where(
      and(eq(venueLocale.venueId, venueRow.id), eq(venueLocale.isEnabled, true))
    )
    .orderBy(asc(venueLocale.sortOrder));

  // Default locale translations (inline in source content already)
  // Gather translations for the default locale
  const allEntityIds = [
    ...tabRows.map((t) => t.id),
    ...categoryIds,
    ...entryRows.map((e) => e.id),
    ...promotionIds,
    ...componentRows.map((c) => c.id),
  ];

  const translationRows =
    allEntityIds.length > 0
      ? await database
          .select({
            entityType: contentTranslation.entityType,
            entityId: contentTranslation.entityId,
            locale: contentTranslation.locale,
            fieldsJson: contentTranslation.fieldsJson,
          })
          .from(contentTranslation)
          .where(
            and(
              eq(contentTranslation.venueId, venueRow.id),
              eq(contentTranslation.locale, venueRow.defaultLocale),
              inArray(contentTranslation.entityId, allEntityIds)
            )
          )
      : [];

  return serializePublicMenu({
    venue: venueRow,
    menu: publishedMenu,
    tabs: tabRows,
    categories: categoryRows,
    entries: entryRows,
    promotions: promotionRows,
    components: componentRows,
    schedules: scheduleRows,
    locales: localeRows,
    translations: translationRows,
  });
}
