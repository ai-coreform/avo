import { Hono } from "hono";
import { protect } from "@/middleware/auth.middleware";
import { catalogItemsRoutes } from "./catalog-items/catalog-items.routes";
import { chatRoutes } from "./chat/chat.routes";
import { filesRoutes } from "./files/files.routes";
import { integrationsRoutes } from "./integrations/integrations.routes";
import { localesRoutes } from "./locales/locales.routes";
import { meRoutes } from "./me/me.routes";
import { menuRoutes } from "./menu/menu.routes";
import { placesRoutes } from "./places/places.routes";
import { translationsRoutes } from "./translations/translations.routes";
import { venueRoutes } from "./venue/venue.routes";

const manageRoutes = new Hono()
  .use(protect)
  .route("/catalog-items", catalogItemsRoutes)
  .route("/chat", chatRoutes)
  .route("/files", filesRoutes)
  .route("/integrations", integrationsRoutes)
  .route("/locales", localesRoutes)
  .route("/me", meRoutes)
  .route("/menus", menuRoutes)
  .route("/places", placesRoutes)
  .route("/translations", translationsRoutes)
  .route("/venue", venueRoutes);

export { manageRoutes };
