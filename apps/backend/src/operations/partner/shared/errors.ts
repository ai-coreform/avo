import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Tagged result type used by catalog operations so routes can translate
 * domain outcomes into HTTP responses without throwing. Operations reserve
 * exceptions for server-side failures (DB down, transaction rolled back).
 */
export type OperationError =
  | { code: "not_found"; message: string }
  | { code: "external_id_conflict"; message: string }
  | { code: "invalid_reference"; message: string; field?: string }
  | { code: "invalid_enum_value"; message: string; field?: string }
  | { code: "validation_failed"; message: string; field?: string };

/**
 * Error envelope to return from routes. Matches the shape documented in
 * docs/partners/connect/errors-and-limits.md.
 */
export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    field?: string;
  };
}

export function errorEnvelope(err: OperationError): ErrorEnvelope {
  const base: ErrorEnvelope["error"] = {
    code: err.code,
    message: err.message,
  };
  if ("field" in err && err.field) {
    base.field = err.field;
  }
  return { error: base };
}

/** Map operation error code to HTTP status. */
export function statusForOperationError(
  err: OperationError
): ContentfulStatusCode {
  switch (err.code) {
    case "not_found":
      return 404;
    case "external_id_conflict":
      return 409;
    case "invalid_reference":
    case "invalid_enum_value":
    case "validation_failed":
      return 422;
    default: {
      const _exhaustive: never = err;
      return _exhaustive;
    }
  }
}

/** Throws a server-side error. Use only for unexpected failures. */
export function internalError(message: string): never {
  throw new HTTPException(500, {
    message: JSON.stringify({
      error: { code: "internal_error", message },
    }),
  });
}
