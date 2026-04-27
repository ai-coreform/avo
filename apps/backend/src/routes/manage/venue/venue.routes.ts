import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { z } from "zod";
import { requireOrgAdmin } from "@/middleware/org-admin";
import { get } from "./procedures/get";
import { setActiveMenuProcedure } from "./procedures/set-active-menu";
import { update } from "./procedures/update";
import { setActiveMenuSchema, updateVenueSchema } from "./venue.schemas";

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

const venueRoutes = new Hono()
  .use(requireOrgAdmin())
  .get("/", async (c) => await get(c))
  .patch(
    "/active-menu",
    validate("json", setActiveMenuSchema),
    async (c) => await setActiveMenuProcedure(c, c.req.valid("json"))
  )
  .patch(
    "/",
    validate("json", updateVenueSchema),
    async (c) => await update(c, c.req.valid("json"))
  );

export { venueRoutes };
