import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { checkSlugQuerySchema, jobIdParamsSchema } from "./onboarding.schemas";
import { checkSlug } from "./procedures/check-slug";
import { importVenue } from "./procedures/import";
import { getImportStatus } from "./procedures/status";

const onboardingRoutes = new Hono()
  .get(
    "/check-slug",
    zValidator("query", checkSlugQuerySchema),
    async (c) => await checkSlug(c, c.req.valid("query"))
  )
  .post("/import", async (c) => await importVenue(c))
  .get(
    "/import/:jobId/status",
    zValidator("param", jobIdParamsSchema),
    async (c) => await getImportStatus(c, c.req.valid("param"))
  );

export { onboardingRoutes };
