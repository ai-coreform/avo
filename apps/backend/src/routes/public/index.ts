import { Hono } from "hono";
import { publicChatRoutes } from "./chat/chat.routes";
import { claimRoute } from "./claim/claim.routes";
import { publicFilesRoutes } from "./files/files.routes";
import { publicInvitationRoutes } from "./invitation/invitation.routes";
import { publicMenuRoutes } from "./menu/menu.routes";
import { publicVenueRoutes } from "./venue/venue.routes";

const publicRoutes = new Hono()
  .route("/chat", publicChatRoutes)
  .route("/claim", claimRoute)
  .route("/files", publicFilesRoutes)
  .route("/invitation", publicInvitationRoutes)
  .route("/menu", publicMenuRoutes)
  .route("/venue", publicVenueRoutes);

export { publicRoutes };
