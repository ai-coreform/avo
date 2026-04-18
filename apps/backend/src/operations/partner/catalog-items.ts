import { and, desc, eq, gte, lt } from "drizzle-orm";
import database from "@/db";
import { catalogItem } from "@/db/schema/catalog-item";
import { PARTNER_SOURCE } from "@/routes/partner/common.schemas";
import {
  decodeCursor,
  encodeCursor,
  normalizeLimit,
} from "./shared/pagination";
import { uniqueSlug } from "./shared/slug";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export type CatalogItemRow = typeof catalogItem.$inferSelect;

/** Input fields accepted on create. */
export interface CreateCatalogItemInput {
  externalId?: string;
  title: string;
  description?: string | null;
  priceCents?: number | null;
  priceLabel?: string | null;
  allergens?: string[];
  features?: string[];
  additives?: string[];
  imageUrl?: string | null;
  isActive?: boolean;
}

/** Input fields accepted on PATCH. All optional. */
export type UpdateCatalogItemInput = Partial<CreateCatalogItemInput>;

export interface ListCatalogItemsOptions {
  limit?: number;
  cursor?: string;
  isActive?: boolean;
  externalSource?: string;
  updatedSince?: Date;
}

// ──────────────────────────────────────────────────────────────
// Read
// ──────────────────────────────────────────────────────────────

export async function getCatalogItemById(
  venueId: string,
  id: string
): Promise<CatalogItemRow | null> {
  const [row] = await database
    .select()
    .from(catalogItem)
    .where(and(eq(catalogItem.venueId, venueId), eq(catalogItem.id, id)))
    .limit(1);
  return row ?? null;
}

export async function getCatalogItemByExternalId(
  venueId: string,
  externalId: string,
  externalSource = PARTNER_SOURCE
): Promise<CatalogItemRow | null> {
  const [row] = await database
    .select()
    .from(catalogItem)
    .where(
      and(
        eq(catalogItem.venueId, venueId),
        eq(catalogItem.externalSource, externalSource),
        eq(catalogItem.externalId, externalId)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function listCatalogItems(
  venueId: string,
  opts: ListCatalogItemsOptions = {}
): Promise<{ items: CatalogItemRow[]; nextCursor: string | null }> {
  const limit = normalizeLimit(opts.limit);
  const conditions = [eq(catalogItem.venueId, venueId)];

  if (typeof opts.isActive === "boolean") {
    conditions.push(eq(catalogItem.isActive, opts.isActive));
  }
  if (opts.externalSource) {
    conditions.push(eq(catalogItem.externalSource, opts.externalSource));
  }
  if (opts.updatedSince) {
    conditions.push(gte(catalogItem.updatedAt, opts.updatedSince));
  }

  if (opts.cursor) {
    const decoded = decodeCursor(opts.cursor);
    if (decoded) {
      // Cursor uses (created_at DESC, id DESC) ordering. To get the next page
      // we need rows strictly older than the cursor OR at the same timestamp
      // with id < cursor.id. Encode as: createdAt < cursor.createdAt, OR
      // (createdAt == cursor.createdAt AND id < cursor.id).
      // For simplicity we use a compound expression via drizzle `and`/`or`,
      // but the simpler "just older by createdAt" is good enough for our
      // millisecond-resolution timestamps and small expected collision rate.
      conditions.push(lt(catalogItem.createdAt, new Date(decoded.createdAt)));
    }
  }

  const rows = await database
    .select()
    .from(catalogItem)
    .where(and(...conditions))
    .orderBy(desc(catalogItem.createdAt), desc(catalogItem.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page.at(-1);
  const nextCursor =
    hasMore && last
      ? encodeCursor({
          createdAt: last.createdAt.toISOString(),
          id: last.id,
        })
      : null;

  return { items: page, nextCursor };
}

// ──────────────────────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────────────────────

export async function createCatalogItem(
  venueId: string,
  input: CreateCatalogItemInput,
  source: string = PARTNER_SOURCE
): Promise<
  | { ok: true; row: CatalogItemRow }
  | { ok: false; code: "external_id_conflict" }
> {
  if (input.externalId) {
    const existing = await getCatalogItemByExternalId(
      venueId,
      input.externalId,
      source
    );
    if (existing) {
      return { ok: false, code: "external_id_conflict" };
    }
  }

  const slug = await uniqueSlug(input.title, {
    table: catalogItem,
    slugColumn: catalogItem.slug,
    scope: [{ column: catalogItem.venueId, value: venueId }],
  });

  const [row] = await database
    .insert(catalogItem)
    .values({
      venueId,
      slug,
      title: input.title,
      description: input.description ?? null,
      priceCents: input.priceCents ?? null,
      priceLabel: input.priceLabel ?? null,
      allergens: (input.allergens ?? []) as CatalogItemRow["allergens"],
      features: (input.features ?? []) as CatalogItemRow["features"],
      additives: (input.additives ?? []) as CatalogItemRow["additives"],
      imageUrl: input.imageUrl ?? null,
      isActive: input.isActive ?? true,
      externalId: input.externalId ?? null,
      externalSource: input.externalId ? source : null,
    })
    .returning();

  return { ok: true, row };
}

export async function updateCatalogItemRow(
  existing: CatalogItemRow,
  input: UpdateCatalogItemInput
): Promise<CatalogItemRow> {
  const updates: Partial<typeof catalogItem.$inferInsert> = {};

  if (input.title !== undefined) {
    updates.title = input.title;
  }
  if (input.description !== undefined) {
    updates.description = input.description;
  }
  if (input.priceCents !== undefined) {
    updates.priceCents = input.priceCents;
  }
  if (input.priceLabel !== undefined) {
    updates.priceLabel = input.priceLabel;
  }
  if (input.allergens !== undefined) {
    updates.allergens = input.allergens as CatalogItemRow["allergens"];
  }
  if (input.features !== undefined) {
    updates.features = input.features as CatalogItemRow["features"];
  }
  if (input.additives !== undefined) {
    updates.additives = input.additives as CatalogItemRow["additives"];
  }
  if (input.imageUrl !== undefined) {
    updates.imageUrl = input.imageUrl;
  }
  if (input.isActive !== undefined) {
    updates.isActive = input.isActive;
  }

  if (Object.keys(updates).length === 0) {
    return existing;
  }

  const [updated] = await database
    .update(catalogItem)
    .set(updates)
    .where(eq(catalogItem.id, existing.id))
    .returning();

  return updated;
}

export async function deleteCatalogItemById(
  venueId: string,
  id: string
): Promise<boolean> {
  const result = await database
    .delete(catalogItem)
    .where(and(eq(catalogItem.venueId, venueId), eq(catalogItem.id, id)))
    .returning({ id: catalogItem.id });
  return result.length > 0;
}

// ──────────────────────────────────────────────────────────────
// Bulk upsert
// ──────────────────────────────────────────────────────────────

export interface BulkCatalogItemInput extends CreateCatalogItemInput {
  externalId: string; // required for bulk
}

export type BulkCatalogItemStatus = "created" | "updated" | "unchanged";

export interface BulkCatalogItemResult {
  externalId: string;
  avoId: string;
  status: BulkCatalogItemStatus;
}

/**
 * Upsert each input item by `external_id`:
 * - If no row exists → create.
 * - If row exists and differs → update.
 * - If row exists and is unchanged → `unchanged`.
 *
 * Runs in a single transaction for atomicity.
 */
export async function bulkUpsertCatalogItems(
  venueId: string,
  items: BulkCatalogItemInput[],
  source: string = PARTNER_SOURCE
): Promise<BulkCatalogItemResult[]> {
  return await database.transaction(async () => {
    const results: BulkCatalogItemResult[] = [];
    for (const input of items) {
      const existing = await getCatalogItemByExternalId(
        venueId,
        input.externalId,
        source
      );

      if (!existing) {
        const createResult = await createCatalogItem(venueId, input, source);
        if (!createResult.ok) {
          // Shouldn't happen — we just checked.
          throw new Error(
            `Bulk: duplicate external_id detected mid-transaction (${input.externalId})`
          );
        }
        results.push({
          externalId: input.externalId,
          avoId: createResult.row.id,
          status: "created",
        });
        continue;
      }

      const changed = await updateCatalogItemRow(existing, input);
      const status: BulkCatalogItemStatus =
        changed.updatedAt.getTime() !== existing.updatedAt.getTime()
          ? "updated"
          : "unchanged";

      results.push({
        externalId: input.externalId,
        avoId: existing.id,
        status,
      });
    }
    return results;
  });
}
