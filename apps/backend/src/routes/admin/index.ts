import { Hono } from "hono";
import { requirePlatformAdmin } from "@/middleware/platform-admin";
import { onboardingRoutes } from "./onboarding/onboarding.routes";
import { overviewRoutes } from "./overview/overview.routes";
import { partnersRoutes } from "./partners/partners.routes";
import { usersRoutes } from "./users/users.routes";
import { venuesRoutes } from "./venues/venues.routes";

const adminRoutes = new Hono()
  .use(requirePlatformAdmin)
  .route("/overview", overviewRoutes)
  .route("/users", usersRoutes)
  .route("/venues", venuesRoutes)
  .route("/onboarding", onboardingRoutes)
  .route("/partners", partnersRoutes);

export { adminRoutes };
