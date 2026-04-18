import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getUser } from "./procedures/get";
import { listUsers } from "./procedures/list";
import { listUsersQuerySchema, userParamsSchema } from "./users.schemas";

const usersRoutes = new Hono()
  .get(
    "/",
    zValidator("query", listUsersQuerySchema),
    async (c) => await listUsers(c, c.req.valid("query"))
  )
  .get(
    "/:userId",
    zValidator("param", userParamsSchema),
    async (c) => await getUser(c, c.req.valid("param"))
  );

export { usersRoutes };
