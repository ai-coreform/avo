import { Hono } from "hono";
import { getOverviewStats } from "./procedures/stats";

const overviewRoutes = new Hono().get(
  "/stats",
  async (c) => await getOverviewStats(c)
);

export { overviewRoutes };
