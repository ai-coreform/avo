import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { updateVenueSchema } from "@/routes/manage/venue/venue.schemas";
import { deleteVenueHandler } from "./procedures/delete";
import { getVenue } from "./procedures/get";
import { listVenues } from "./procedures/list";
import { setActiveVenue } from "./procedures/set-active";
import { updateVenueHandler } from "./procedures/update";
import { updateMemberHandler } from "./procedures/update-member";
import {
  listVenuesQuerySchema,
  memberParamsSchema,
  updateMemberSchema,
  venueParamsSchema,
} from "./venues.schemas";

const venuesRoutes = new Hono()
  .get(
    "/",
    zValidator("query", listVenuesQuerySchema),
    async (c) => await listVenues(c, c.req.valid("query"))
  )
  .get(
    "/:venueId",
    zValidator("param", venueParamsSchema),
    async (c) => await getVenue(c, c.req.valid("param"))
  )
  .patch(
    "/:venueId",
    zValidator("param", venueParamsSchema),
    zValidator("json", updateVenueSchema),
    async (c) =>
      await updateVenueHandler(c, c.req.valid("param"), c.req.valid("json"))
  )
  .delete(
    "/:venueId",
    zValidator("param", venueParamsSchema),
    async (c) => await deleteVenueHandler(c, c.req.valid("param"))
  )
  .post(
    "/:venueId/set-active",
    zValidator("param", venueParamsSchema),
    async (c) => await setActiveVenue(c, c.req.valid("param"))
  )
  .patch(
    "/:venueId/members/:userId",
    zValidator("param", memberParamsSchema),
    zValidator("json", updateMemberSchema),
    async (c) =>
      await updateMemberHandler(c, c.req.valid("param"), c.req.valid("json"))
  );

export { venuesRoutes };
