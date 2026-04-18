import { z } from "zod";

export const checkSlugQuerySchema = z.object({
  slug: z.string().min(1),
});

export const jobIdParamsSchema = z.object({
  jobId: z.string().uuid(),
});
