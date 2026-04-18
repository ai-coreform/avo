import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { googlePlacesService } from "@/lib/google-places";
import { requireOrgAdmin } from "@/middleware/org-admin";
import {
  mapAutocompleteResponse,
  mapPlaceDetailsToAddress,
} from "./places.mapper";
import {
  placeDetailsParamsSchema,
  placeResolveQuerySchema,
  placesAutocompleteSchema,
} from "./places.schemas";

const placesRoutes = new Hono()
  .use(requireOrgAdmin())
  .post(
    "/autocomplete",
    zValidator("json", placesAutocompleteSchema),
    async (c) => {
      const payload = c.req.valid("json");

      const data = await googlePlacesService.fetchAutocomplete({
        input: payload.input,
        sessionToken: payload.sessionToken,
        languageCode: payload.languageCode,
        regionCode: payload.regionCode,
        includedPrimaryTypes: payload.includedPrimaryTypes,
        locationBias: payload.locationBias,
      });

      return c.json({ data: mapAutocompleteResponse(data) });
    }
  )
  .get(
    "/resolve/:placeId",
    zValidator("param", placeDetailsParamsSchema),
    zValidator("query", placeResolveQuerySchema),
    async (c) => {
      const { placeId } = c.req.valid("param");
      const query = c.req.valid("query");

      const data = await googlePlacesService.fetchDetails({
        placeId,
        sessionToken: query.sessionToken,
        languageCode: query.languageCode,
        regionCode: query.regionCode,
      });

      return c.json({ data: mapPlaceDetailsToAddress(data) });
    }
  );

export { placesRoutes };
