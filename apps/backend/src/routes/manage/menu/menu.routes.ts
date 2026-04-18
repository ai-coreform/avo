import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { z } from "zod";
import { requireOrgAdmin } from "@/middleware/org-admin";
import { get as getEditor } from "./editor/procedures/get";
import { update as updateEditor } from "./editor/procedures/update";
import { updateMenuEditorSchema } from "./editor.schemas";
import {
  createMenuSchema,
  menuParamsSchema,
  updateMenuSchema,
} from "./menu.schemas";
import { create } from "./procedures/create";
import { remove } from "./procedures/delete";
import { get } from "./procedures/get";
import { list } from "./procedures/list";
import { preview } from "./procedures/preview";
import { update } from "./procedures/update";
import { promosRoutes } from "./promos/promos.routes";

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

const menuRoutes = new Hono()
  .use(requireOrgAdmin())
  .get("/", async (c) => await list(c))
  .post(
    "/",
    validate("json", createMenuSchema),
    async (c) => await create(c, c.req.valid("json"))
  )
  .get(
    "/:menuSlug",
    validate("param", menuParamsSchema),
    async (c) => await get(c, c.req.valid("param"))
  )
  .get(
    "/:menuSlug/preview",
    validate("param", menuParamsSchema),
    async (c) => await preview(c, c.req.valid("param"))
  )
  .get(
    "/:menuSlug/editor",
    validate("param", menuParamsSchema),
    async (c) => await getEditor(c, c.req.valid("param"))
  )
  .patch(
    "/:menuSlug",
    validate("param", menuParamsSchema),
    validate("json", updateMenuSchema),
    async (c) => await update(c, c.req.valid("param"), c.req.valid("json"))
  )
  .put(
    "/:menuSlug/editor",
    validate("param", menuParamsSchema),
    validate("json", updateMenuEditorSchema),
    async (c) =>
      await updateEditor(c, c.req.valid("param"), c.req.valid("json"))
  )
  .delete(
    "/:menuSlug",
    validate("param", menuParamsSchema),
    async (c) => await remove(c, c.req.valid("param"))
  )
  .route("/:menuSlug/promos", promosRoutes);

export { menuRoutes };
