import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .pipe(z.string().url().optional())
  .optional();

const socialsSchema = z
  .object({
    instagramUrl: optionalUrl,
    tiktokUrl: optionalUrl,
    facebookUrl: optionalUrl,
  })
  .strict();

export const updateVenueSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    logo: z.string().trim().nullable().optional(),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain only lowercase letters, numbers, and hyphens"
      )
      .optional(),
    socials: socialsSchema.nullable().optional(),
    address: z.string().trim().nullable().optional(),
    addressLine1: z.string().trim().nullable().optional(),
    addressLine2: z.string().trim().nullable().optional(),
    city: z.string().trim().nullable().optional(),
    region: z.string().trim().nullable().optional(),
    postalCode: z.string().trim().nullable().optional(),
    country: z.string().trim().nullable().optional(),
    countryCode: z.string().trim().max(2).nullable().optional(),
    placeId: z.string().trim().nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
  })
  .strict();

export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;

export const setActiveMenuSchema = z
  .object({
    menuId: z.string().uuid().nullable(),
  })
  .strict();

export type SetActiveMenuInput = z.infer<typeof setActiveMenuSchema>;
