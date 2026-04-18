import { asc, eq } from "drizzle-orm";
import database from "@/db";
import { venue } from "@/db/schema/auth/venue";
import { catalogItem } from "@/db/schema/catalog-item";
import { menu } from "@/db/schema/menu";
import { menuCategory } from "@/db/schema/menu-category";
import { menuEntry } from "@/db/schema/menu-entry";
import { menuTab } from "@/db/schema/menu-tab";
import { promotion } from "@/db/schema/promotion";

/**
 * Builds a structured text summary of the venue's menus for the AI system prompt.
 * Includes all menus, tabs, categories, entries (with catalog item details), and promotions.
 */
export async function getMenuContext(venueId: string): Promise<string> {
  const [venueRow] = await database
    .select({ name: venue.name })
    .from(venue)
    .where(eq(venue.id, venueId))
    .limit(1);

  const menus = await database
    .select()
    .from(menu)
    .where(eq(menu.venueId, venueId))
    .orderBy(asc(menu.sortOrder));

  if (menus.length === 0) {
    return "MENU ATTUALE:\nNessun menu presente.";
  }

  const lines: string[] = [
    `VENUE: ${venueRow?.name ?? "Sconosciuto"}`,
    "",
    "MENU ATTUALE:",
  ];

  for (const m of menus) {
    lines.push(`\n## Menu: ${m.name} (stato: ${m.status}, slug: ${m.slug})`);
    await appendMenuTabs(lines, m.id);
  }

  await appendPromotions(lines, menus[0].id);

  return lines.join("\n");
}

async function appendMenuTabs(lines: string[], menuId: string) {
  const tabs = await database
    .select()
    .from(menuTab)
    .where(eq(menuTab.menuId, menuId))
    .orderBy(asc(menuTab.sortOrder));

  for (const tab of tabs) {
    lines.push(`\n### Tab: ${tab.label}${tab.isVisible ? "" : " [nascosto]"}`);
    await appendCategories(lines, tab.id);
  }
}

async function appendCategories(lines: string[], tabId: string) {
  const categories = await database
    .select()
    .from(menuCategory)
    .where(eq(menuCategory.tabId, tabId))
    .orderBy(asc(menuCategory.sortOrder));

  for (const cat of categories) {
    lines.push(
      `\n#### Categoria: ${cat.title} (id: ${cat.id})${cat.isVisible ? "" : " [nascosta]"}`
    );
    await appendEntries(lines, cat.id);
  }
}

interface EntryRow {
  id: string;
  kind: string | null;
  rowTitle: string | null;
  isVisible: boolean;
  priceCentsOverride: number | null;
  priceLabelOverride: string | null;
  catalogTitle: string | null;
  catalogDescription: string | null;
  catalogPriceCents: number | null;
  catalogPriceLabel: string | null;
  catalogAllergens: string[] | null;
  catalogFeatures: string[] | null;
}

function formatEntryLine(entry: EntryRow): string {
  if (entry.kind === "group") {
    return `  [Gruppo] ${entry.rowTitle ?? "Senza nome"}`;
  }

  const title = entry.catalogTitle ?? entry.rowTitle ?? "Senza titolo";
  const priceCents =
    entry.priceCentsOverride ?? entry.catalogPriceCents ?? null;
  const priceLabel =
    entry.priceLabelOverride ?? entry.catalogPriceLabel ?? null;
  const priceStr =
    priceCents != null
      ? ` — ${(priceCents / 100).toFixed(2)}€${priceLabel ? ` ${priceLabel}` : ""}`
      : "";
  const desc = entry.catalogDescription ? ` | ${entry.catalogDescription}` : "";
  const visibility = entry.isVisible ? "" : " [nascosto]";
  const allergens =
    entry.catalogAllergens && entry.catalogAllergens.length > 0
      ? ` | Allergeni: ${entry.catalogAllergens.join(", ")}`
      : "";
  const features =
    entry.catalogFeatures && entry.catalogFeatures.length > 0
      ? ` | ${entry.catalogFeatures.join(", ")}`
      : "";

  return `  - ${title} (id: ${entry.id})${priceStr}${desc}${allergens}${features}${visibility}`;
}

async function appendEntries(lines: string[], categoryId: string) {
  const entries = await database
    .select({
      id: menuEntry.id,
      kind: menuEntry.kind,
      rowTitle: menuEntry.title,
      isVisible: menuEntry.isVisible,
      priceCentsOverride: menuEntry.priceCentsOverride,
      priceLabelOverride: menuEntry.priceLabelOverride,
      catalogTitle: catalogItem.title,
      catalogDescription: catalogItem.description,
      catalogPriceCents: catalogItem.priceCents,
      catalogPriceLabel: catalogItem.priceLabel,
      catalogAllergens: catalogItem.allergens,
      catalogFeatures: catalogItem.features,
    })
    .from(menuEntry)
    .leftJoin(catalogItem, eq(menuEntry.catalogItemId, catalogItem.id))
    .where(eq(menuEntry.categoryId, categoryId))
    .orderBy(asc(menuEntry.sortOrder));

  for (const entry of entries) {
    lines.push(formatEntryLine(entry));
  }
}

async function appendPromotions(lines: string[], menuId: string) {
  const promos = await database
    .select()
    .from(promotion)
    .where(eq(promotion.menuId, menuId))
    .orderBy(asc(promotion.sortOrder));

  if (promos.length === 0) {
    return;
  }

  lines.push("\n\nPROMOZIONI:");
  for (const p of promos) {
    const activeStr = p.isActive ? "" : " [disattiva]";
    const origPrice =
      p.originalPrice != null
        ? ` (originale: ${p.originalPrice.toFixed(2)}€)`
        : "";
    lines.push(
      `  - ${p.title} (id: ${p.id}) — ${p.promoPrice.toFixed(2)}€${origPrice}${activeStr}`
    );
    lines.push(`    ${p.shortDescription}`);
    if (p.longDescription) {
      lines.push(`    ${p.longDescription}`);
    }
  }
}

/**
 * Returns the venue name for use in the system prompt.
 */
export async function getVenueName(venueId: string): Promise<string> {
  const [row] = await database
    .select({ name: venue.name })
    .from(venue)
    .where(eq(venue.id, venueId))
    .limit(1);

  return row?.name ?? "Ristorante";
}
