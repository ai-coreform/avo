import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { z } from "zod";
import {
  menuParamSchema,
  resolveVenueParamSchema,
  translationParamsSchema,
} from "./menu.schemas";
import { get as getFullMenu } from "./procedures/get-full-menu";
import { get as getTranslations } from "./procedures/get-translations";
import { resolveVenueMenu } from "./procedures/resolve-venue-menu";

function validate<
  TTarget extends "json" | "param",
  TSchema extends z.ZodTypeAny,
>(target: TTarget, schema: TSchema) {
  return zValidator(target, schema, (result) => {
    if (!result.success) {
      throw result.error;
    }
  });
}

const publicMenuRoutes = new Hono()
  .get(
    "/resolve-venue/:venueSlug",
    validate("param", resolveVenueParamSchema),
    async (c) => await resolveVenueMenu(c, c.req.valid("param").venueSlug)
  )
  .get(
    "/:venueSlug/:menuSlug",
    validate("param", menuParamSchema),
    async (c) => await getFullMenu(c, c.req.valid("param"))
  )
  .get(
    "/:venueSlug/:menuSlug/translations/:locale",
    validate("param", translationParamsSchema),
    async (c) => await getTranslations(c, c.req.valid("param"))
  );

export { publicMenuRoutes };
