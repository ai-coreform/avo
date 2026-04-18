import z from "zod";

const languageCodePattern = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const regionCodePattern = /^[A-Z]{2}$/;
const sessionTokenPattern = /^[A-Za-z0-9._-]{8,128}$/;

const languageCodeSchema = z
  .string()
  .trim()
  .regex(languageCodePattern, "Use a valid language code (for example: en)");

const regionCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(regionCodePattern, "Use a 2-letter region code (for example: US)");

const sessionTokenSchema = z
  .string()
  .trim()
  .regex(
    sessionTokenPattern,
    "Session token must be 8-128 characters and contain only letters, numbers, ., _, or -"
  );

export const placesAutocompleteSchema = z
  .object({
    input: z
      .string()
      .trim()
      .min(2, "Input must include at least 2 characters")
      .max(200, "Input must include at most 200 characters"),
    sessionToken: sessionTokenSchema.optional(),
    languageCode: languageCodeSchema.optional(),
    regionCode: regionCodeSchema.optional(),
    includedPrimaryTypes: z.string().array().optional(),
    locationBias: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        radiusMeters: z.number().int().min(1).max(50_000),
      })
      .strict()
      .optional(),
  })
  .strict();

export const placeDetailsParamsSchema = z
  .object({
    placeId: z.string().trim().min(1, "Place ID is required"),
  })
  .strict();

export const placeResolveQuerySchema = z
  .object({
    sessionToken: sessionTokenSchema.optional(),
    languageCode: languageCodeSchema.optional(),
    regionCode: regionCodeSchema.optional(),
  })
  .strict();

export type PlacesAutocompleteInput = z.infer<typeof placesAutocompleteSchema>;
export type PlaceDetailsParamsInput = z.infer<typeof placeDetailsParamsSchema>;
export type PlaceResolveQueryInput = z.infer<typeof placeResolveQuerySchema>;
