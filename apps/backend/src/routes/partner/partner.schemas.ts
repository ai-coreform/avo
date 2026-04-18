import { z } from "zod";

/**
 * Shared Zod schemas and constants for partner API routes.
 */

/** ISO-3166-1 alpha-2 country code. */
const countryCodeRegex = /^[A-Z]{2}$/;

/** IANA timezone — simplified check, Date.prototype.toLocaleString will reject invalid values at runtime too. */
const timezoneRegex = /^[A-Za-z_]+\/[A-Za-z0-9_+\-/]+$/;

/** ISO-4217 3-letter currency code. */
const currencyCodeRegex = /^[A-Z]{3}$/;

/**
 * Body schema for `POST /api/partner/provision`.
 */
export const provisionBodySchema = z
  .object({
    connect_venue_id: z.string().min(1).max(128),
    venue: z.object({
      name: z.string().min(1).max(200),
      address: z.string().max(500).optional(),
      country: z.string().regex(countryCodeRegex, "ISO-3166-1 alpha-2"),
      timezone: z.string().regex(timezoneRegex, "IANA timezone"),
      currency: z.string().regex(currencyCodeRegex, "ISO-4217"),
    }),
    owner: z.object({
      email: z.string().email(),
      name: z.string().min(1).max(200),
      locale: z.string().min(2).max(5).optional(),
    }),
  })
  .strict();

export type ProvisionBody = z.infer<typeof provisionBodySchema>;

/**
 * Body schema for `POST /api/public/claim/:token`.
 * For now the body is empty — the token in the path is the whole contract.
 * Future: optional password + ToS acceptance flag.
 */
export const claimBodySchema = z
  .object({
    password: z.string().min(8).max(128).optional(),
    accept_terms: z.boolean().optional(),
  })
  .strict();

export type ClaimBody = z.infer<typeof claimBodySchema>;
