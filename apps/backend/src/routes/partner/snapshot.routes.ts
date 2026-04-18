import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { partnerErrors } from "@/lib/errors/partner-api-error";
import {
  requireVenueIdMatch,
  requireVenueLink,
} from "@/middleware/partner-auth";
import { applySnapshot } from "@/operations/partner/snapshot";
import { snapshotBodySchema } from "./snapshot.schemas";

/**
 * Partner API — catalog snapshot (atomic tree import).
 * Mounted at /api/partner/venues/:venueId/catalog/snapshot
 *
 * POST `{ catalog_items?, menus? }` → upserts everything atomically, then
 * deletes partner-sourced rows that no longer appear.
 *
 * Allowed venue_link statuses: `pending_claim` OR `active`. Items/menus with
 * `external_source = null` (Avo-native / user-created) are always preserved.
 *
 * Webhooks: snapshot does NOT emit per-resource events under any circumstances.
 * Initial import events would be noise; if the caller wants fine-grained
 * notifications they should use per-resource CRUD endpoints instead.
 * The `X-Avo-Import: true` header is accepted and expected but the suppression
 * is the default behavior.
 */
export const snapshotRoute = new Hono()
  .use(requireVenueLink({ allowPendingClaim: true }))
  .use(requireVenueIdMatch())
  .post(
    "/",
    zValidator("json", snapshotBodySchema, (result) => {
      if (!result.success) {
        throw partnerErrors.invalidPayload(
          result.error.issues[0]?.message ?? "Invalid payload",
          result.error.issues[0]?.path.join(".")
        );
      }
    }),
    async (c) => {
      const venue = c.get("partnerVenue");
      const body = c.req.valid("json");

      const outcome = await applySnapshot(venue.id, body);

      if (outcome.kind === "error") {
        return c.json(
          {
            error: {
              code: outcome.code,
              message: outcome.message,
              field: outcome.field,
            },
          },
          422
        );
      }

      return c.json(outcome.result);
    }
  );
