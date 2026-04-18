import { zValidator } from "@hono/zod-validator";
import { and, eq, ilike } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import database from "@/db";
import { catalogItem } from "@/db/schema/catalog-item";
import { requireOrgAdmin } from "@/middleware/org-admin";

const listQuerySchema = z.object({
  search: z.string().optional(),
});

const catalogItemsRoutes = new Hono().use(requireOrgAdmin()).get(
  "/",
  zValidator("query", listQuerySchema, (result) => {
    if (!result.success) {
      throw result.error;
    }
  }),
  async (c) => {
    const member = c.get("member");
    const { search } = c.req.valid("query");

    const conditions = [
      eq(catalogItem.venueId, member.venueId),
      eq(catalogItem.isActive, true),
    ];

    if (search) {
      conditions.push(ilike(catalogItem.title, `%${search}%`));
    }

    const items = await database
      .select({
        id: catalogItem.id,
        title: catalogItem.title,
        description: catalogItem.description,
        priceCents: catalogItem.priceCents,
        priceLabel: catalogItem.priceLabel,
        allergens: catalogItem.allergens,
        features: catalogItem.features,
        additives: catalogItem.additives,
        imageUrl: catalogItem.imageUrl,
      })
      .from(catalogItem)
      .where(and(...conditions))
      .orderBy(catalogItem.title);

    return c.json({ data: items });
  }
);

export { catalogItemsRoutes };
