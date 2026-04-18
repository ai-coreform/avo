import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Structured error for the partner API + public claim endpoints.
 *
 * Extends HTTPException so route handlers can `throw` — the central error
 * middleware (`src/middleware/error.middleware.ts`) detects this class and
 * serializes it to the partner contract documented in
 * `docs/partners/connect/errors-and-limits.md`:
 *
 *     {
 *       "error": {
 *         "code":       "invalid_venue_link",
 *         "message":    "...",
 *         "field":      "allergens.0",    // optional
 *         "request_id": "req_..."          // auto-populated from X-Request-Id
 *       }
 *     }
 *
 * This intentionally differs from Avo's dashboard contract (`{success: false,
 * error: {...}}`) because Connect and future EMS partners consume `error.code`
 * directly by snake_case value, not by generic HTTP-status-derived codes.
 */
export class PartnerApiError extends HTTPException {
  readonly code: string;
  readonly field?: string;
  /**
   * Extra fields merged into the error envelope verbatim. Used for domain-
   * specific payloads documented per error code, e.g. `resolution_url` on
   * `email_already_exists`, `details` with Zod issues, etc.
   */
  readonly extra?: Record<string, unknown>;
  /** Marker so the error middleware can branch without instanceof fragility. */
  readonly isPartnerApiError = true as const;

  constructor(
    status: ContentfulStatusCode,
    opts: {
      code: string;
      message: string;
      field?: string;
      extra?: Record<string, unknown>;
    }
  ) {
    super(status, { message: opts.message });
    this.code = opts.code;
    this.field = opts.field;
    this.extra = opts.extra;
  }
}

/** Convenience constructors for the most common error shapes. */
export const partnerErrors = {
  invalidPayload(message: string, field?: string) {
    return new PartnerApiError(400, {
      code: "invalid_payload",
      message,
      field,
    });
  },
  invalidQuery(message: string) {
    return new PartnerApiError(400, {
      code: "invalid_query",
      message,
    });
  },
  notFound(message: string, code = "not_found") {
    return new PartnerApiError(404, {
      code,
      message,
    });
  },
  conflict(code: string, message: string) {
    return new PartnerApiError(409, {
      code,
      message,
    });
  },
  unprocessable(code: string, message: string, field?: string) {
    return new PartnerApiError(422, {
      code,
      message,
      field,
    });
  },
};
