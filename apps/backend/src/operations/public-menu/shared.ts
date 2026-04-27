import type { AiWaiterSettings } from "@/operations/chat/ai-waiter-types";
import type { MenuThemeData } from "@/types/menu-theme";

interface VenueRow {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  defaultLocale: string;
  aiSettings: AiWaiterSettings;
}

interface MenuRow {
  id: string;
  name: string;
  slug: string;
  theme: MenuThemeData;
}

interface TabRow {
  id: string;
  label: string;
  slug: string;
}

interface CategoryRow {
  id: string;
  tabId: string;
  slug: string;
  title: string;
}

interface EntryRow {
  id: string;
  categoryId: string;
  kind: "entry" | "group";
  rowTitle: string | null;
  priceCentsOverride: number | null;
  priceLabelOverride: string | null;
  catalogItemId: string | null;
  title: string | null;
  description: string | null;
  priceCents: number | null;
  priceLabel: string | null;
  allergens: string[] | null;
  features: string[] | null;
  additives: string[] | null;
  imageUrl: string | null;
}

interface PromotionRow {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string | null;
  promoPrice: number;
  originalPrice: number | null;
  imageUrl: string | null;
  badgeLabel: string | null;
}

interface ComponentRow {
  id: string;
  promotionId: string;
  displayName: string | null;
  quantity: number;
  sortOrder: number;
}

interface ScheduleRow {
  id: string;
  promotionId: string;
  weekday: string | null;
  startTime: string | null;
  endTime: string | null;
  startDate: string | null;
  endDate: string | null;
  timezone: string;
  isActive: boolean;
}

interface LocaleRow {
  locale: string;
  isEnabled: boolean;
}

interface TranslationRow {
  entityType: string;
  entityId: string;
  locale: string;
  fieldsJson: Record<string, string | null>;
}

interface SerializeInput {
  venue: VenueRow;
  menu: MenuRow;
  tabs: TabRow[];
  categories: CategoryRow[];
  entries: EntryRow[];
  promotions: PromotionRow[];
  components: ComponentRow[];
  schedules: ScheduleRow[];
  locales: LocaleRow[];
  translations: TranslationRow[];
}

function buildTranslationsMap(translations: TranslationRow[]) {
  const map = new Map<string, Record<string, string | null>>();
  for (const t of translations) {
    map.set(t.entityId, t.fieldsJson);
  }
  return map;
}

function resolveEntryTitle(
  entry: EntryRow,
  translationsMap: Map<string, Record<string, string | null>>
): string {
  const t = translationsMap.get(entry.id);
  return t?.title || entry.title || entry.rowTitle || "";
}

function resolveEntryDescription(
  entry: EntryRow,
  translationsMap: Map<string, Record<string, string | null>>
): string | null {
  const t = translationsMap.get(entry.id);
  return t?.description || entry.description || null;
}

export function serializePublicMenu(input: SerializeInput) {
  const translationsMap = buildTranslationsMap(input.translations);

  // Build category map by tab
  const categoriesByTab = new Map<string, typeof input.categories>();
  for (const cat of input.categories) {
    const existing = categoriesByTab.get(cat.tabId);
    if (existing) {
      existing.push(cat);
    } else {
      categoriesByTab.set(cat.tabId, [cat]);
    }
  }

  // Build entries map by category
  const entriesByCategory = new Map<string, typeof input.entries>();
  for (const entry of input.entries) {
    const existing = entriesByCategory.get(entry.categoryId);
    if (existing) {
      existing.push(entry);
    } else {
      entriesByCategory.set(entry.categoryId, [entry]);
    }
  }

  // Build components map by promotion
  const componentsByPromo = new Map<string, typeof input.components>();
  for (const comp of input.components) {
    const existing = componentsByPromo.get(comp.promotionId);
    if (existing) {
      existing.push(comp);
    } else {
      componentsByPromo.set(comp.promotionId, [comp]);
    }
  }

  // Build schedules map by promotion
  const schedulesByPromo = new Map<string, typeof input.schedules>();
  for (const sched of input.schedules) {
    const existing = schedulesByPromo.get(sched.promotionId);
    if (existing) {
      existing.push(sched);
    } else {
      schedulesByPromo.set(sched.promotionId, [sched]);
    }
  }

  return {
    venue: {
      name: input.venue.name,
      slug: input.venue.slug,
      logo: input.venue.logo,
      defaultLocale: input.venue.defaultLocale,
      locales: input.locales.map((l) => ({
        locale: l.locale,
        isEnabled: l.isEnabled,
      })),
      // Public-safe SUBSET of aiSettings. We deliberately do NOT ship
      // personality, ownerInstructions, promotions, pairings, or guardrails
      // to the public client — those are server-side only (chat backend reads
      // them from the venue row directly). Only bgColor and questions affect
      // the surfaces the public menu renders before the chat backend is hit.
      aiSettings: {
        bgColor: input.venue.aiSettings?.bgColor,
        questions: input.venue.aiSettings?.questions,
      },
    },
    menu: {
      id: input.menu.id,
      name: input.menu.name,
      slug: input.menu.slug,
      theme: input.menu.theme,
      tabs: input.tabs.map((tab) => {
        const tabTranslation = translationsMap.get(tab.id);
        const categories = categoriesByTab.get(tab.id) ?? [];

        return {
          id: tab.id,
          label: tabTranslation?.label || tab.label,
          slug: tab.slug,
          categories: categories.map((cat) => {
            const catTranslation = translationsMap.get(cat.id);
            const entries = entriesByCategory.get(cat.id) ?? [];

            return {
              id: cat.id,
              title: catTranslation?.title || cat.title,
              slug: cat.slug,
              entries: entries.map((entry) => ({
                id: entry.id,
                kind: entry.kind,
                title: resolveEntryTitle(entry, translationsMap),
                description: resolveEntryDescription(entry, translationsMap),
                price: entry.priceCentsOverride ?? entry.priceCents,
                priceLabel: entry.priceLabelOverride ?? entry.priceLabel,
                imageUrl: entry.imageUrl,
                allergens: entry.allergens ?? [],
                features: entry.features ?? [],
                additives: entry.additives ?? [],
              })),
            };
          }),
        };
      }),
      promotions: input.promotions.map((promo) => {
        const promoTranslation = translationsMap.get(promo.id);
        const components = componentsByPromo.get(promo.id) ?? [];
        const schedules = schedulesByPromo.get(promo.id) ?? [];

        return {
          id: promo.id,
          slug: promo.slug,
          title: promoTranslation?.title || promo.title,
          shortDescription:
            promoTranslation?.short_description || promo.shortDescription,
          longDescription:
            promoTranslation?.long_description || promo.longDescription,
          promoPrice: promo.promoPrice,
          originalPrice: promo.originalPrice,
          imageUrl: promo.imageUrl,
          badgeLabel: promo.badgeLabel,
          components: components.map((comp) => ({
            displayName: comp.displayName,
            quantity: comp.quantity,
          })),
          schedules: schedules.map((sched) => ({
            weekday: sched.weekday,
            startTime: sched.startTime,
            endTime: sched.endTime,
            startDate: sched.startDate,
            endDate: sched.endDate,
            timezone: sched.timezone,
          })),
        };
      }),
    },
  };
}
