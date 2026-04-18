import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { getUniqueVenueSlug } from "@/operations/venue/get-unique-slug";

const slugBodySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

const publicVenueRoutes = new Hono().post(
  "/generate-slug",
  zValidator("json", slugBodySchema, (result) => {
    if (!result.success) {
      throw result.error;
    }
  }),
  async (c) => {
    const { name } = c.req.valid("json");
    const slug = await getUniqueVenueSlug(name);
    return c.json({ data: { slug } });
  }
);

export { publicVenueRoutes };
