import { z } from "zod";

export const translateSchema = z.object({
  locales: z.array(z.string().min(2).max(5)).min(1),
  missingOnly: z.boolean().optional().default(false),
});
