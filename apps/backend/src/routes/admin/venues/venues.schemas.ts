import { z } from "zod";

export const listVenuesQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const venueParamsSchema = z.object({
  venueId: z.string().uuid(),
});

export const memberParamsSchema = z.object({
  venueId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const updateMemberSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    email: z.string().trim().email().optional(),
    phoneNumber: z.string().trim().nullable().optional(),
    role: z.enum(["owner", "admin", "member"]).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
