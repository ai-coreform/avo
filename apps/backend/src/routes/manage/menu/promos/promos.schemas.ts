import { z } from "zod";

const weekdayValues = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

const componentSchema = z.object({
  catalogItemId: z.string().uuid().nullable(),
  displayName: z.string().nullable(),
  quantity: z.number().int().min(1).default(1),
});

const timeRegex = /^\d{2}:\d{2}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const scheduleSchema = z
  .object({
    weekday: z.enum(weekdayValues).nullable(),
    startTime: z
      .string()
      .regex(timeRegex, "Formato HH:mm richiesto")
      .nullable(),
    endTime: z.string().regex(timeRegex, "Formato HH:mm richiesto").nullable(),
    startDate: z
      .string()
      .regex(dateRegex, "Formato YYYY-MM-DD richiesto")
      .nullable(),
    endDate: z
      .string()
      .regex(dateRegex, "Formato YYYY-MM-DD richiesto")
      .nullable(),
    timezone: z.string().min(1),
    isActive: z.boolean().default(true),
  })
  .refine(
    (s) =>
      (s.startTime === null && s.endTime === null) ||
      (s.startTime !== null && s.endTime !== null),
    { message: "startTime e endTime devono essere entrambi presenti o nulli" }
  )
  .refine(
    (s) => {
      const hasWeekday = s.weekday !== null;
      const hasDateRange = s.startDate !== null || s.endDate !== null;
      return !(hasWeekday && hasDateRange);
    },
    {
      message: "weekday e startDate/endDate sono mutuamente esclusivi",
    }
  );

const translationFieldsSchema = z.object({
  title: z.string().trim().max(120).nullable().default(null),
  description: z.string().trim().max(500).nullable().default(null),
});

const translationsSchema = z.record(z.string(), translationFieldsSchema);

export const createPromoSchema = z.object({
  title: z.string().trim().min(1),
  shortDescription: z.string().trim().min(1),
  longDescription: z.string().trim().nullable().default(null),
  promoPrice: z.number().min(0),
  originalPrice: z.number().min(0).nullable().default(null),
  imageUrl: z.string().nullable().default(null),
  badgeLabel: z.string().trim().nullable().default(null),
  isActive: z.boolean().default(true),
  components: z.array(componentSchema).default([]),
  schedules: z.array(scheduleSchema).default([]),
  translations: translationsSchema.optional().default({}),
});

export const updatePromoSchema = z.object({
  title: z.string().trim().min(1).optional(),
  shortDescription: z.string().trim().min(1).optional(),
  longDescription: z.string().trim().nullable().optional(),
  promoPrice: z.number().min(0).optional(),
  originalPrice: z.number().min(0).nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  badgeLabel: z.string().trim().nullable().optional(),
  isActive: z.boolean().optional(),
  components: z.array(componentSchema).optional(),
  schedules: z.array(scheduleSchema).optional(),
  translations: translationsSchema.optional(),
});

export const promoParamsSchema = z.object({
  menuSlug: z.string().min(1),
  promoId: z.string().uuid(),
});

export const sortPromosSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int().min(0),
    })
  ),
});

export type CreatePromoPayload = z.infer<typeof createPromoSchema>;
export type UpdatePromoPayload = z.infer<typeof updatePromoSchema>;
export type SortPromosPayload = z.infer<typeof sortPromosSchema>;
