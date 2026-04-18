import { and, eq, ilike, sql } from "drizzle-orm";
import database from "@/db";
import { catalogItem } from "@/db/schema/catalog-item";
import { menu } from "@/db/schema/menu";
import { menuCategory } from "@/db/schema/menu-category";
import { menuEntry } from "@/db/schema/menu-entry";
import { promotion } from "@/db/schema/promotion";
import { translateAndPersist } from "@/operations/translations/translate";
import { getVenueSecondaryLocaleCodes } from "@/routes/manage/locales/locales.service";
import { slugify } from "@/utils/slugify";

export interface ToolResult {
  success: boolean;
  message: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve a menu entry ID by UUID or by fuzzy title lookup on the joined catalog item.
 */
async function resolveMenuEntryId(
  venueId: string,
  id: string | undefined,
  title: string | undefined
): Promise<{ entryId: string; catalogItemId: string | null }> {
  // Try by UUID first
  if (id && UUID_RE.test(id)) {
    const [row] = await database
      .select({
        id: menuEntry.id,
        catalogItemId: menuEntry.catalogItemId,
      })
      .from(menuEntry)
      .where(eq(menuEntry.id, id))
      .limit(1);
    if (row) {
      return { entryId: row.id, catalogItemId: row.catalogItemId };
    }
    // UUID not found — fall through to title lookup
  }

  // Try by title (fuzzy match on catalog item)
  const searchTitle = title || id; // fallback: model may put the name in item_id
  if (!searchTitle) {
    throw new Error("ID elemento mancante e nessun titolo fornito");
  }

  const [row] = await database
    .select({
      entryId: menuEntry.id,
      catalogItemId: menuEntry.catalogItemId,
    })
    .from(menuEntry)
    .innerJoin(catalogItem, eq(menuEntry.catalogItemId, catalogItem.id))
    .where(
      and(
        eq(catalogItem.venueId, venueId),
        ilike(catalogItem.title, `%${searchTitle}%`)
      )
    )
    .limit(1);

  if (!row) {
    throw new Error(`Elemento "${searchTitle}" non trovato nel menu`);
  }
  return { entryId: row.entryId, catalogItemId: row.catalogItemId };
}

export async function executeTool(
  venueId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    return await executeToolInner(venueId, toolName, args);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Operazione non riuscita";
    return { success: false, message };
  }
}

function fireAndForgetTranslation(
  venueId: string,
  table: string,
  rowId: string,
  fields: Record<string, string | null | undefined>,
  context: string
) {
  getVenueSecondaryLocaleCodes(venueId)
    .then((locales) =>
      translateAndPersist(venueId, table, rowId, fields, context, locales)
    )
    .catch(() => {
      // Translation is best-effort
    });
}

async function handleUpdatePrice(
  venueId: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const { item_id, item_title, new_price } = args as {
    item_id: string;
    item_title: string;
    new_price: number;
  };
  const { catalogItemId } = await resolveMenuEntryId(
    venueId,
    item_id,
    item_title
  );
  if (!catalogItemId) {
    throw new Error("Voce senza catalog item associato");
  }

  await database
    .update(catalogItem)
    .set({ priceCents: Math.round(new_price * 100) })
    .where(eq(catalogItem.id, catalogItemId));

  return {
    success: true,
    message: `Prezzo di "${item_title}" aggiornato a ${new_price.toFixed(2)}€`,
  };
}

async function handleUpdateItem(
  venueId: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const { item_id, item_title, updates, description_of_changes } = args as {
    item_id: string;
    item_title: string;
    updates: Record<string, unknown>;
    description_of_changes: string;
  };
  const { catalogItemId } = await resolveMenuEntryId(
    venueId,
    item_id,
    item_title
  );
  if (!catalogItemId) {
    throw new Error("Voce senza catalog item associato");
  }

  const allowedFields = ["title", "description", "priceLabel"];
  const catalogUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      catalogUpdates[key] = value;
    } else if (key === "price" && typeof value === "number") {
      // LLM sends price in euros; DB stores cents.
      catalogUpdates.priceCents = Math.round(value * 100);
    }
  }

  if (Object.keys(catalogUpdates).length === 0) {
    return { success: false, message: "Nessun campo valido da aggiornare" };
  }

  await database
    .update(catalogItem)
    .set(catalogUpdates)
    .where(eq(catalogItem.id, catalogItemId));

  const translatableFields: Record<string, string | null | undefined> = {};
  if (catalogUpdates.title) {
    translatableFields.title = catalogUpdates.title as string;
  }
  if (catalogUpdates.description) {
    translatableFields.description = catalogUpdates.description as string;
  }
  if (Object.keys(translatableFields).length > 0) {
    fireAndForgetTranslation(
      venueId,
      "catalog_item",
      catalogItemId,
      translatableFields,
      "menu item for an Italian restaurant"
    );
  }

  return {
    success: true,
    message: `"${item_title}" aggiornato: ${description_of_changes}`,
  };
}

async function handleAddItem(
  venueId: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const { title, category_id, category_title, price, description, priceLabel } =
    args as {
      title: string;
      category_id: string;
      category_title: string;
      price?: number;
      description?: string;
      priceLabel?: string;
    };

  const [cat] = await database
    .select({ id: menuCategory.id, menuId: menuCategory.menuId })
    .from(menuCategory)
    .where(eq(menuCategory.id, category_id))
    .limit(1);

  if (!cat) {
    throw new Error(`Categoria "${category_title}" non trovata`);
  }

  const slug = slugify(title) || "item";
  const [created] = await database
    .insert(catalogItem)
    .values({
      venueId,
      slug,
      title,
      description: description ?? null,
      // LLM sends price in euros; DB stores cents.
      priceCents: price != null ? Math.round(price * 100) : null,
      priceLabel: priceLabel ?? null,
    })
    .returning({ id: catalogItem.id });

  const [maxSort] = await database
    .select({
      max: sql<number>`coalesce(max(${menuEntry.sortOrder}), -1)`,
    })
    .from(menuEntry)
    .where(eq(menuEntry.categoryId, category_id));

  await database.insert(menuEntry).values({
    menuId: cat.menuId,
    categoryId: category_id,
    kind: "entry",
    catalogItemId: created.id,
    sortOrder: Number(maxSort?.max ?? -1) + 1,
  });

  const translatableFields: Record<string, string | null | undefined> = {
    title,
  };
  if (description) {
    translatableFields.description = description;
  }
  fireAndForgetTranslation(
    venueId,
    "catalog_item",
    created.id,
    translatableFields,
    "menu item for an Italian restaurant"
  );

  const priceInfo = price != null ? ` a ${price.toFixed(2)}€` : "";
  return {
    success: true,
    message: `"${title}" aggiunto alla categoria "${category_title}"${priceInfo}`,
  };
}

async function handleRemoveItem(
  venueId: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const { item_id, item_title } = args as {
    item_id: string;
    item_title: string;
  };
  const { entryId } = await resolveMenuEntryId(venueId, item_id, item_title);

  await database.delete(menuEntry).where(eq(menuEntry.id, entryId));

  return {
    success: true,
    message: `"${item_title}" rimosso dal menu`,
  };
}

async function handleToggleItemActive(
  args: Record<string, unknown>
): Promise<ToolResult> {
  const { category_id, category_title, is_active } = args as {
    category_id: string;
    category_title: string;
    is_active: boolean;
  };

  await database
    .update(menuCategory)
    .set({ isVisible: is_active })
    .where(eq(menuCategory.id, category_id));

  return {
    success: true,
    message: `Categoria "${category_title}" ${is_active ? "attivata" : "disattivata"}`,
  };
}

async function handleCreatePromo(
  venueId: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const {
    title,
    shortDescription,
    promoPrice,
    originalPrice,
    imageUrl,
    isActive,
  } = args as {
    title: string;
    shortDescription: string;
    promoPrice: number;
    originalPrice?: number;
    imageUrl?: string;
    isActive?: boolean;
  };

  const [firstMenu] = await database
    .select({ id: menu.id })
    .from(menu)
    .where(eq(menu.venueId, venueId))
    .limit(1);

  if (!firstMenu) {
    throw new Error("Nessun menu trovato per questa venue");
  }

  const promoSlug = slugify(title) || "promo";

  const [maxSort] = await database
    .select({
      max: sql<number>`coalesce(max(${promotion.sortOrder}), -1)`,
    })
    .from(promotion)
    .where(eq(promotion.menuId, firstMenu.id));

  await database.insert(promotion).values({
    menuId: firstMenu.id,
    slug: promoSlug,
    title,
    shortDescription,
    promoPrice,
    originalPrice: originalPrice ?? null,
    imageUrl: imageUrl ?? null,
    isActive: isActive ?? true,
    sortOrder: Number(maxSort?.max ?? -1) + 1,
  });

  return {
    success: true,
    message: `Promozione "${title}" creata a ${promoPrice.toFixed(2)}€`,
  };
}

async function handleUpdatePromo(
  args: Record<string, unknown>
): Promise<ToolResult> {
  const { promo_id, promo_title, updates } = args as {
    promo_id: string;
    promo_title: string;
    updates: Record<string, unknown>;
  };

  const allowedFields = [
    "title",
    "shortDescription",
    "longDescription",
    "promoPrice",
    "originalPrice",
    "imageUrl",
    "badgeLabel",
    "isActive",
  ];
  const promoUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      promoUpdates[key] = value;
    }
  }

  if (Object.keys(promoUpdates).length === 0) {
    return { success: false, message: "Nessun campo valido da aggiornare" };
  }

  await database
    .update(promotion)
    .set(promoUpdates)
    .where(eq(promotion.id, promo_id));

  return {
    success: true,
    message: `Promozione "${promo_title}" aggiornata`,
  };
}

async function handleDeletePromo(
  args: Record<string, unknown>
): Promise<ToolResult> {
  const { promo_id, promo_title } = args as {
    promo_id: string;
    promo_title: string;
  };

  await database.delete(promotion).where(eq(promotion.id, promo_id));

  return {
    success: true,
    message: `Promozione "${promo_title}" eliminata`,
  };
}

function executeToolInner(
  venueId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  switch (toolName) {
    case "update_price":
      return handleUpdatePrice(venueId, args);
    case "update_item":
      return handleUpdateItem(venueId, args);
    case "add_item":
      return handleAddItem(venueId, args);
    case "remove_item":
      return handleRemoveItem(venueId, args);
    case "toggle_item_active":
      return handleToggleItemActive(args);
    case "create_promo":
      return handleCreatePromo(venueId, args);
    case "update_promo":
      return handleUpdatePromo(args);
    case "delete_promo":
      return handleDeletePromo(args);
    default:
      return Promise.resolve({
        success: false,
        message: `Tool sconosciuto: ${toolName}`,
      });
  }
}
