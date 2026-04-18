import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { z } from "zod";
import {
  menuParamSchema,
  resolveMenuParamSchema,
  translationParamsSchema,
} from "./menu.schemas";
import { get as getFullMenu } from "./procedures/get-full-menu";
import { get as getTranslations } from "./procedures/get-translations";
import { resolveMenu } from "./procedures/resolve-menu";

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
    "/resolve/:menuId",
    validate("param", resolveMenuParamSchema),
    async (c) => await resolveMenu(c, c.req.valid("param").menuId)
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
