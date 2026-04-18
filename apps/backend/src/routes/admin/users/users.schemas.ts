import { z } from "zod";

export const listUsersQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const userParamsSchema = z.object({
  userId: z.string().uuid(),
});
