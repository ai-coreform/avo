import { and, eq, inArray } from "drizzle-orm";
import type { Task } from "graphile-worker";
import database from "@/db";
import { catalogItem } from "@/db/schema/catalog-item";
import { contentTranslation } from "@/db/schema/content-translation";
import { menu } from "@/db/schema/menu";
import { menuCategory } from "@/db/schema/menu-category";
import { menuEntry } from "@/db/schema/menu-entry";
import { menuTab } from "@/db/schema/menu-tab";
import { promotion } from "@/db/schema/promotion";
import { promotionComponent } from "@/db/schema/promotion-component";
import { translationJob } from "@/db/schema/translation-job";
import { translateAndPersist } from "@/operations/translations/translate";

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 500;

interface TranslationRunPayload {
  jobId: string;
  venueId: string;
}

interface TranslationWorkUnit {
  entityType: string;
  entityId: string;
  fields: Record<string, string | null>;
  context: string;
  locales: string[];
}

export const translationRunTask: Task = async (_payload, _helpers) => {
  console.log(
    "[translations.run] Task invoked with payload:",
    _payload,
    "type:",
    typeof _payload
  );
  const payload = (
    typeof _payload === "string" ? JSON.parse(_payload) : _payload
  ) as TranslationRunPayload;
  const { jobId, venueId } = payload;

  // Load job from DB
  const [job] = await database
    .select()
    .from(translationJob)
    .where(eq(translationJob.id, jobId))
    .limit(1);

  if (!job) {
    console.error(`[translations.run] Job ${jobId} not found in DB`);
    return;
  }

  console.log(`[translations.run] Job ${jobId} loaded, status=${job.status}`);

  if (job.status !== "pending") {
    console.warn(
      `[translations.run] Job ${jobId} has status "${job.status}", skipping`
    );
    return;
  }

  const targetLocales = job.targetLocales;
  const missingOnly = job.missingOnly === 1;

  // Mark as running
  await database
    .update(translationJob)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(translationJob.id, jobId));
  console.log(`[translations.run] Job ${jobId} marked as running`);

  try {
    const workUnits = await buildWorkUnits(venueId, targetLocales, missingOnly);
    console.log(`[translations.run] Built ${workUnits.length} work units`);

    // Update total
    await database
      .update(translationJob)
      .set({ totalUnits: workUnits.length })
      .where(eq(translationJob.id, jobId));

    if (workUnits.length === 0) {
      await database
        .update(translationJob)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(translationJob.id, jobId));
      return;
    }

    let completedUnits = 0;
    let failedUnits = 0;

    for (let i = 0; i < workUnits.length; i += BATCH_SIZE) {
      const batch = workUnits.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map((unit) =>
          translateAndPersist(
            venueId,
            unit.entityType,
            unit.entityId,
            unit.fields,
            unit.context,
            unit.locales
          )
        )
      );

      for (const [idx, result] of results.entries()) {
        if (result.status === "fulfilled") {
          completedUnits++;
        } else {
          failedUnits++;
          console.error(
            `[translations.run] Failed ${batch[idx]?.entityType}/${batch[idx]?.entityId}:`,
            result.reason
          );
        }
      }

      // Update progress in DB
      await database
        .update(translationJob)
        .set({ completedUnits, failedUnits })
        .where(eq(translationJob.id, jobId));

      // Delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < workUnits.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    // Final status
    const finalStatus = failedUnits > 0 ? "failed" : "completed";
    const errorMessage =
      failedUnits > 0 ? `${failedUnits} translations failed` : null;

    await database
      .update(translationJob)
      .set({
        status: finalStatus,
        completedUnits,
        failedUnits,
        errorMessage,
        completedAt: new Date(),
      })
      .where(eq(translationJob.id, jobId));
    console.log(
      `[translations.run] Job ${jobId} finished: ${finalStatus} (${completedUnits} ok, ${failedUnits} failed)`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[translations.run] Job ${jobId} crashed:`, error);

    await database
      .update(translationJob)
      .set({
        status: "failed",
        errorMessage,
        completedAt: new Date(),
      })
      .where(eq(translationJob.id, jobId));

    throw error;
  }
};

type GetMissingLocales = (entityType: string, entityId: string) => string[];

async function buildMenuWorkUnits(
  menuIds: string[],
  getMissingLocales: GetMissingLocales
): Promise<TranslationWorkUnit[]> {
  const units: TranslationWorkUnit[] = [];

  const tabs = await database
    .select({ id: menuTab.id, label: menuTab.label })
    .from(menuTab)
    .where(inArray(menuTab.menuId, menuIds));

  const categories = await database
    .select({ id: menuCategory.id, title: menuCategory.title })
    .from(menuCategory)
    .where(inArray(menuCategory.menuId, menuIds));

  const entries = await database
    .select({
      id: menuEntry.id,
      title: menuEntry.title,
      kind: menuEntry.kind,
      catalogTitle: catalogItem.title,
      catalogDescription: catalogItem.description,
    })
    .from(menuEntry)
    .leftJoin(catalogItem, eq(menuEntry.catalogItemId, catalogItem.id))
    .where(inArray(menuEntry.menuId, menuIds));

  for (const tab of tabs) {
    const locales = getMissingLocales("menu_tab", tab.id);
    if (locales.length > 0) {
      units.push({
        entityType: "menu_tab",
        entityId: tab.id,
        fields: { title: tab.label },
        context: "menu tab name",
        locales,
      });
    }
  }

  for (const category of categories) {
    const locales = getMissingLocales("menu_category", category.id);
    if (locales.length > 0) {
      units.push({
        entityType: "menu_category",
        entityId: category.id,
        fields: { title: category.title },
        context: "menu category name",
        locales,
      });
    }
  }

  for (const entry of entries) {
    const title = entry.title ?? entry.catalogTitle;
    if (!title) {
      continue;
    }
    const locales = getMissingLocales("menu_entry", entry.id);
    if (locales.length > 0) {
      const fields: Record<string, string | null> = { title };
      if (entry.catalogDescription) {
        fields.description = entry.catalogDescription;
      }
      units.push({
        entityType: "menu_entry",
        entityId: entry.id,
        fields,
        context:
          entry.kind === "group"
            ? "menu group name"
            : "menu item name and description",
        locales,
      });
    }
  }

  return units;
}

async function buildPromoWorkUnits(
  menuIds: string[],
  getMissingLocales: GetMissingLocales
): Promise<TranslationWorkUnit[]> {
  const units: TranslationWorkUnit[] = [];

  const promos = await database
    .select({
      id: promotion.id,
      title: promotion.title,
      shortDescription: promotion.shortDescription,
      longDescription: promotion.longDescription,
    })
    .from(promotion)
    .where(inArray(promotion.menuId, menuIds));

  for (const promo of promos) {
    const locales = getMissingLocales("promotion", promo.id);
    if (locales.length > 0) {
      const fields: Record<string, string | null> = {
        title: promo.title,
        description: promo.shortDescription,
      };
      if (promo.longDescription) {
        fields.longDescription = promo.longDescription;
      }
      units.push({
        entityType: "promotion",
        entityId: promo.id,
        fields,
        context: "promotion title and description for a restaurant menu",
        locales,
      });
    }
  }

  const promoIds = promos.map((p) => p.id);
  if (promoIds.length > 0) {
    const components = await database
      .select({
        id: promotionComponent.id,
        displayName: promotionComponent.displayName,
      })
      .from(promotionComponent)
      .where(inArray(promotionComponent.promotionId, promoIds));

    for (const comp of components) {
      if (!comp.displayName) {
        continue;
      }
      const locales = getMissingLocales("promotion_component", comp.id);
      if (locales.length > 0) {
        units.push({
          entityType: "promotion_component",
          entityId: comp.id,
          fields: { title: comp.displayName },
          context: "promotion component name for a restaurant menu",
          locales,
        });
      }
    }
  }

  return units;
}

async function buildWorkUnits(
  venueId: string,
  targetLocales: string[],
  missingOnly: boolean
): Promise<TranslationWorkUnit[]> {
  const venueMenus = await database
    .select({ id: menu.id })
    .from(menu)
    .where(eq(menu.venueId, venueId));
  const menuIds = venueMenus.map((m) => m.id);

  if (menuIds.length === 0) {
    return [];
  }

  let existingTranslations: Set<string> | null = null;
  if (missingOnly) {
    const existing = await database
      .select({
        entityType: contentTranslation.entityType,
        entityId: contentTranslation.entityId,
        locale: contentTranslation.locale,
      })
      .from(contentTranslation)
      .where(
        and(
          eq(contentTranslation.venueId, venueId),
          inArray(contentTranslation.locale, targetLocales)
        )
      );

    existingTranslations = new Set(
      existing.map((e) => `${e.entityType}:${e.entityId}:${e.locale}`)
    );
  }

  const getMissingLocales: GetMissingLocales = (entityType, entityId) => {
    if (!existingTranslations) {
      return targetLocales;
    }
    return targetLocales.filter(
      (l) => !existingTranslations.has(`${entityType}:${entityId}:${l}`)
    );
  };

  const [menuUnits, promoUnits] = await Promise.all([
    buildMenuWorkUnits(menuIds, getMissingLocales),
    buildPromoWorkUnits(menuIds, getMissingLocales),
  ]);

  return [...menuUnits, ...promoUnits];
}
