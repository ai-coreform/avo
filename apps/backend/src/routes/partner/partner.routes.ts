import { Hono } from "hono";
import { requirePartner } from "@/middleware/partner-auth";
import { partnerIdempotency } from "@/middleware/partner-idempotency";
import { partnerRateLimit } from "@/middleware/partner-rate-limit";
import { partnerRequestLogger } from "@/middleware/partner-request-logger";
import { catalogItemsRoute } from "./catalog-items.routes";
import { menuCategoriesRoute } from "./menu-categories.routes";
import { menuEntriesRoute } from "./menu-entries.routes";
import { menuTabsRoute } from "./menu-tabs.routes";
import { menusRoute } from "./menus.routes";
import { pingRoute } from "./ping.routes";
import { provisionRoute } from "./provision.routes";
import { snapshotRoute } from "./snapshot.routes";
import { venueLinksRoute } from "./venue-links.routes";

/**
 * Partner API namespace. All routes here authenticate via
 * `Authorization: Bearer <api_key>` and share the same rate limits
 * + idempotency handling.
 *
 * Venue-scoped sub-routes additionally apply `requireVenueLink()` + the
 * `X-Avo-Venue-Link` header.
 *
 * Mounted at `/api/partner` — see src/app.ts.
 */
const partnerRoutes = new Hono()
  .use(partnerRequestLogger)
  .use(requirePartner())
  .use(partnerRateLimit())
  .use(partnerIdempotency())
  .route("/ping", pingRoute)
  .route("/provision", provisionRoute)
  // DELETE /venues/:venueId/link
  .route("/venues", venueLinksRoute)
  // POST /venues/:venueId/catalog/snapshot
  .route("/venues/:venueId/catalog/snapshot", snapshotRoute)
  // GET/POST/PATCH/DELETE /venues/:venueId/catalog/items[/...]
  .route("/venues/:venueId/catalog/items", catalogItemsRoute)
  // GET/POST/PATCH/DELETE /venues/:venueId/menus[/...]
  .route("/venues/:venueId/menus", menusRoute)
  // GET/POST/PATCH/DELETE /venues/:venueId/menus/:menuId/tabs[/...]
  .route("/venues/:venueId/menus/:menuId/tabs", menuTabsRoute)
  // GET/POST/PATCH/DELETE /venues/:venueId/menus/:menuId/categories[/...]
  .route("/venues/:venueId/menus/:menuId/categories", menuCategoriesRoute)
  // GET/POST/PATCH/DELETE /venues/:venueId/menus/:menuId/entries[/...]
  .route("/venues/:venueId/menus/:menuId/entries", menuEntriesRoute);

export { partnerRoutes };
