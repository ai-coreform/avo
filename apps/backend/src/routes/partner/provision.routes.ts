import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { PartnerApiError } from "@/lib/errors/partner-api-error";
import { provisionVenue } from "@/operations/partner/provision";
import { provisionBodySchema } from "./partner.schemas";

/**
 * POST /api/partner/provision
 *
 * Creates (or refreshes) a venue + pending user + venue link + claim token
 * on behalf of a partner. Idempotent on (partner, connect_venue_id).
 *
 * Response matches docs/partners/connect/api-reference.md#provisioning.
 */
export const provisionRoute = new Hono().post(
  "/",
  zValidator("json", provisionBodySchema, (result) => {
    if (!result.success) {
      throw new PartnerApiError(400, {
        code: "invalid_payload",
        message: result.error.issues[0]?.message ?? "Invalid payload",
        field: result.error.issues[0]?.path.join("."),
        extra: { details: result.error.issues },
      });
    }
  }),
  async (c) => {
    const partnerRow = c.get("partner");
    const body = c.req.valid("json");

    const result = await provisionVenue(partnerRow, body);

    switch (result.kind) {
      case "created":
        return c.json(
          {
            avo_venue_id: result.avoVenueId,
            link_token: result.linkToken,
            claim_url: result.claimUrl,
            claim_expires_at: result.claimExpiresAt.toISOString(),
            status: "pending_claim",
          },
          201
        );

      case "existing_pending_claim":
        return c.json(
          {
            avo_venue_id: result.avoVenueId,
            link_token: result.linkToken,
            claim_url: result.claimUrl,
            claim_expires_at: result.claimExpiresAt.toISOString(),
            status: "pending_claim",
          },
          200
        );

      case "email_conflict":
        throw new PartnerApiError(409, {
          code: "email_already_exists",
          message:
            "An Avo account already exists for this email with an active venue membership.",
          extra: { resolution_url: result.resolutionUrl },
        });

      case "already_provisioned":
        throw new PartnerApiError(409, {
          code: "already_provisioned",
          message:
            "An active venue link already exists for this (partner, connect_venue_id).",
        });

      default: {
        // Exhaustive check
        const _exhaustive: never = result;
        return _exhaustive;
      }
    }
  }
);
