import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requireOrgAdmin } from "@/middleware/org-admin";
import {
  clearFailedJobs,
  getTranslationStatus,
  startTranslationRun,
} from "@/operations/translations/job";
import { getTranslationStats } from "@/operations/translations/stats";
import { translateSchema } from "./translations.schemas";

const translationsRoutes = new Hono()
  .use(requireOrgAdmin())
  .get("/stats", async (c) => {
    const member = c.get("member");
    const stats = await getTranslationStats(member.venueId);
    return c.json({ data: stats });
  })
  .get("/status", async (c) => {
    const member = c.get("member");
    const job = await getTranslationStatus(member.venueId);
    console.log(
      "[status] Polling:",
      job
        ? {
            id: job.id,
            status: job.status,
            units: `${job.completedUnits}/${job.totalUnits}`,
          }
        : null
    );
    return c.json({ data: { job } });
  })
  .post("/translate", zValidator("json", translateSchema), async (c) => {
    const member = c.get("member");
    const { locales, missingOnly } = c.req.valid("json");

    // Clear stale failed jobs before starting a new run
    await clearFailedJobs(member.venueId);

    const job = await startTranslationRun(member.venueId, {
      locales,
      missingOnly,
    });

    return c.json({ data: { job } });
  });

export { translationsRoutes };
