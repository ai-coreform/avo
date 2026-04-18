import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ZodError, type ZodIssue } from "zod";
import { PartnerApiError } from "@/lib/errors/partner-api-error";

// ============================================================================
// Error Codes - Used by frontend to identify error types
// ============================================================================

const ERROR_CODES = {
  // Client errors (4xx)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  CONFLICT: "CONFLICT",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  UNPROCESSABLE_ENTITY: "UNPROCESSABLE_ENTITY",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",

  // Database errors
  UNIQUE_VIOLATION: "UNIQUE_VIOLATION",
  FOREIGN_KEY_VIOLATION: "FOREIGN_KEY_VIOLATION",
  NOT_NULL_VIOLATION: "NOT_NULL_VIOLATION",
  CHECK_VIOLATION: "CHECK_VIOLATION",
  DATABASE_ERROR: "DATABASE_ERROR",

  // Server errors (5xx)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  GATEWAY_TIMEOUT: "GATEWAY_TIMEOUT",

  // Network/Connection errors
  NETWORK_ERROR: "NETWORK_ERROR",
  CONNECTION_REFUSED: "CONNECTION_REFUSED",
  TIMEOUT: "TIMEOUT",
} as const;

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ============================================================================
// User-friendly messages for each error code
// ============================================================================

const USER_FRIENDLY_MESSAGES: Record<ErrorCode, string> = {
  // Client errors
  [ERROR_CODES.VALIDATION_ERROR]:
    "The information provided is invalid. Please check your input and try again.",
  [ERROR_CODES.BAD_REQUEST]:
    "We couldn't process your request. Please check your input and try again.",
  [ERROR_CODES.UNAUTHORIZED]:
    "You need to sign in to access this resource. Please log in and try again.",
  [ERROR_CODES.FORBIDDEN]:
    "You don't have permission to perform this action. Contact support if you believe this is an error.",
  [ERROR_CODES.NOT_FOUND]:
    "The resource you're looking for doesn't exist or has been removed.",
  [ERROR_CODES.METHOD_NOT_ALLOWED]:
    "This action is not supported. Please try a different approach.",
  [ERROR_CODES.CONFLICT]:
    "This operation conflicts with existing data. The item may already exist.",
  [ERROR_CODES.PAYLOAD_TOO_LARGE]:
    "The data you're trying to send is too large. Please reduce the size and try again.",
  [ERROR_CODES.UNPROCESSABLE_ENTITY]:
    "We understand your request but cannot process it. Please verify your data.",
  [ERROR_CODES.TOO_MANY_REQUESTS]:
    "You've made too many requests. Please wait a moment and try again.",

  // Database errors
  [ERROR_CODES.UNIQUE_VIOLATION]:
    "This item already exists. Please use different values or update the existing item.",
  [ERROR_CODES.FOREIGN_KEY_VIOLATION]:
    "This operation references data that doesn't exist or cannot be removed because other data depends on it.",
  [ERROR_CODES.NOT_NULL_VIOLATION]:
    "A required field is missing. Please fill in all required information.",
  [ERROR_CODES.CHECK_VIOLATION]:
    "The provided value doesn't meet the required criteria. Please check your input.",
  [ERROR_CODES.DATABASE_ERROR]:
    "A database error occurred. Please try again later.",

  // Server errors
  [ERROR_CODES.INTERNAL_ERROR]:
    "Something went wrong on our end. Our team has been notified. Please try again later.",
  [ERROR_CODES.SERVICE_UNAVAILABLE]:
    "The service is temporarily unavailable. Please try again in a few minutes.",
  [ERROR_CODES.GATEWAY_TIMEOUT]:
    "The request took too long to process. Please try again.",

  // Network errors
  [ERROR_CODES.NETWORK_ERROR]:
    "A network error occurred. Please check your connection and try again.",
  [ERROR_CODES.CONNECTION_REFUSED]:
    "Unable to connect to the server. Please try again later.",
  [ERROR_CODES.TIMEOUT]: "The request timed out. Please try again.",
};

// ============================================================================
// Regex patterns defined at module level for performance
// ============================================================================

const PG_CODE_PATTERN = /^[0-9A-Z]{5}$/;
const TECHNICAL_MESSAGE_PATTERN = /Error:/;
const CONSTRAINT_KEY_SUFFIX = /_key$/;
const CONSTRAINT_UNIQUE_SUFFIX = /_unique$/;
const UNDERSCORE_PATTERN = /_/g;

// ============================================================================
// PostgreSQL Error Handling
// ============================================================================

interface PostgresErrorShape {
  code?: string;
  errno?: string;
  detail?: string;
  constraint?: string;
  table?: string;
  schema?: string;
  column?: string;
  message?: string;
  severity?: string;
}

// PostgreSQL error codes mapping
// Reference: https://www.postgresql.org/docs/current/errcodes-appendix.html
const PG_ERROR_CODE_MAP: Record<
  string,
  { code: ErrorCode; status: ContentfulStatusCode }
> = {
  // Class 23 — Integrity Constraint Violation
  "23000": { code: ERROR_CODES.DATABASE_ERROR, status: 400 },
  "23001": { code: ERROR_CODES.FOREIGN_KEY_VIOLATION, status: 400 },
  "23502": { code: ERROR_CODES.NOT_NULL_VIOLATION, status: 400 },
  "23503": { code: ERROR_CODES.FOREIGN_KEY_VIOLATION, status: 400 },
  "23505": { code: ERROR_CODES.UNIQUE_VIOLATION, status: 409 },
  "23514": { code: ERROR_CODES.CHECK_VIOLATION, status: 400 },

  // Class 08 — Connection Exception
  "08000": { code: ERROR_CODES.CONNECTION_REFUSED, status: 503 },
  "08003": { code: ERROR_CODES.CONNECTION_REFUSED, status: 503 },
  "08006": { code: ERROR_CODES.CONNECTION_REFUSED, status: 503 },

  // Class 40 — Transaction Rollback
  "40001": { code: ERROR_CODES.DATABASE_ERROR, status: 503 },
  "40P01": { code: ERROR_CODES.DATABASE_ERROR, status: 503 },

  // Class 53 — Insufficient Resources
  "53000": { code: ERROR_CODES.SERVICE_UNAVAILABLE, status: 503 },
  "53100": { code: ERROR_CODES.SERVICE_UNAVAILABLE, status: 503 },
  "53200": { code: ERROR_CODES.SERVICE_UNAVAILABLE, status: 503 },
  "53300": { code: ERROR_CODES.SERVICE_UNAVAILABLE, status: 503 },

  // Class 57 — Operator Intervention
  "57014": { code: ERROR_CODES.TIMEOUT, status: 504 },
  "57P01": { code: ERROR_CODES.SERVICE_UNAVAILABLE, status: 503 },
  "57P02": { code: ERROR_CODES.SERVICE_UNAVAILABLE, status: 503 },
  "57P03": { code: ERROR_CODES.SERVICE_UNAVAILABLE, status: 503 },
};

function isPgErrorCode(pgCode: string): boolean {
  return (
    pgCode.startsWith("ERR_POSTGRES_") ||
    PG_CODE_PATTERN.test(pgCode) ||
    Boolean(PG_ERROR_CODE_MAP[pgCode])
  );
}

function checkPgError(obj: PostgresErrorShape): PostgresErrorShape | null {
  const pgCode = obj.code || obj.errno;
  if (pgCode && isPgErrorCode(pgCode)) {
    return obj;
  }
  return null;
}

function extractPgError(err: unknown): PostgresErrorShape | null {
  if (!err || typeof err !== "object") {
    return null;
  }

  // Check direct error
  const direct = checkPgError(err as PostgresErrorShape);
  if (direct) {
    return direct;
  }

  // Check error cause (nested errors)
  const cause = (err as { cause?: unknown }).cause;
  if (cause && typeof cause === "object") {
    const nested = checkPgError(cause as PostgresErrorShape);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function getPgErrorInfo(
  pgError: PostgresErrorShape
): { code: ErrorCode; status: ContentfulStatusCode } | null {
  const pgCode = pgError.errno || pgError.code;
  if (!pgCode) {
    return null;
  }

  // Direct match
  if (PG_ERROR_CODE_MAP[pgCode]) {
    return PG_ERROR_CODE_MAP[pgCode];
  }

  // Check for ERR_POSTGRES_ prefix and extract the actual code
  if (pgCode.startsWith("ERR_POSTGRES_")) {
    const actualCode = pgCode.replace("ERR_POSTGRES_", "");
    if (PG_ERROR_CODE_MAP[actualCode]) {
      return PG_ERROR_CODE_MAP[actualCode];
    }
  }

  return null;
}

function formatConstraintName(constraint: string): string {
  return constraint
    .replace(CONSTRAINT_KEY_SUFFIX, "")
    .replace(CONSTRAINT_UNIQUE_SUFFIX, "")
    .replace(UNDERSCORE_PATTERN, " ");
}

// ============================================================================
// Zod Validation Error Handling
// ============================================================================

interface ZodFieldError {
  field: string;
  message: string;
}

function mapZodIssueToFieldError(issue: ZodIssue): ZodFieldError {
  return {
    field: issue.path.join(".") || "unknown",
    message: issue.message,
  };
}

function formatZodError(error: ZodError): {
  message: string;
  fields: ZodFieldError[];
} {
  const fields: ZodFieldError[] = error.issues.map(mapZodIssueToFieldError);

  if (fields.length === 1) {
    return {
      message: `${fields[0].field}: ${fields[0].message}`,
      fields,
    };
  }

  return {
    message: `Multiple validation errors: ${fields.map((f) => f.field).join(", ")}`,
    fields,
  };
}

// ============================================================================
// HTTP Status Code Handling
// ============================================================================

const HTTP_STATUS_CODE_MAP: Record<number, ErrorCode> = {
  400: ERROR_CODES.BAD_REQUEST,
  401: ERROR_CODES.UNAUTHORIZED,
  403: ERROR_CODES.FORBIDDEN,
  404: ERROR_CODES.NOT_FOUND,
  405: ERROR_CODES.METHOD_NOT_ALLOWED,
  409: ERROR_CODES.CONFLICT,
  413: ERROR_CODES.PAYLOAD_TOO_LARGE,
  422: ERROR_CODES.UNPROCESSABLE_ENTITY,
  429: ERROR_CODES.TOO_MANY_REQUESTS,
  500: ERROR_CODES.INTERNAL_ERROR,
  502: ERROR_CODES.GATEWAY_TIMEOUT,
  503: ERROR_CODES.SERVICE_UNAVAILABLE,
  504: ERROR_CODES.GATEWAY_TIMEOUT,
};

function getErrorCodeFromStatus(status: number): ErrorCode {
  return HTTP_STATUS_CODE_MAP[status] || ERROR_CODES.INTERNAL_ERROR;
}

// ============================================================================
// Network Error Detection
// ============================================================================

const NETWORK_ERROR_PATTERNS = [
  "econnrefused",
  "enotfound",
  "econnreset",
  "etimedout",
  "epipe",
  "enetunreach",
  "eai_again",
  "fetch failed",
  "network error",
  "failed to fetch",
];

function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) {
    return false;
  }

  const message = err.message.toLowerCase();
  const name = err.name.toLowerCase();

  return NETWORK_ERROR_PATTERNS.some(
    (pattern) => message.includes(pattern) || name.includes(pattern)
  );
}

function getNetworkErrorCode(err: Error): ErrorCode {
  const message = err.message.toLowerCase();

  if (message.includes("timeout") || message.includes("etimedout")) {
    return ERROR_CODES.TIMEOUT;
  }
  if (message.includes("econnrefused")) {
    return ERROR_CODES.CONNECTION_REFUSED;
  }

  return ERROR_CODES.NETWORK_ERROR;
}

// ============================================================================
// Error Response Types
// ============================================================================

interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: string;
    fields?: ZodFieldError[];
    // Only included in development
    stack?: string;
    raw?: unknown;
  };
}

// ============================================================================
// Error Result Type for processors
// ============================================================================

interface ProcessedError {
  statusCode: ContentfulStatusCode;
  errorCode: ErrorCode;
  message: string;
  details?: string;
  fields?: ZodFieldError[];
}

// ============================================================================
// Error Processing Helpers
// ============================================================================

function processZodError(err: ZodError): ProcessedError {
  const formatted = formatZodError(err);
  return {
    statusCode: 400,
    errorCode: ERROR_CODES.VALIDATION_ERROR,
    message: USER_FRIENDLY_MESSAGES[ERROR_CODES.VALIDATION_ERROR],
    details: formatted.message,
    fields: formatted.fields,
  };
}

function processHTTPException(
  err: HTTPException,
  isDev: boolean
): ProcessedError {
  const statusCode = err.status as ContentfulStatusCode;
  const errorCode = getErrorCodeFromStatus(statusCode);
  let message = err.message || USER_FRIENDLY_MESSAGES[errorCode];
  let details: string | undefined;

  // If the message is too technical, use the friendly version
  if (message.length > 150 || TECHNICAL_MESSAGE_PATTERN.test(message)) {
    details = isDev ? err.message : undefined;
    message = USER_FRIENDLY_MESSAGES[errorCode];
  }

  return { statusCode, errorCode, message, details };
}

function getPgErrorDetails(
  pgError: PostgresErrorShape,
  errorCode: ErrorCode
): string | undefined {
  let details = pgError.detail || pgError.message;

  if (errorCode === ERROR_CODES.UNIQUE_VIOLATION && pgError.constraint) {
    const constraintName = formatConstraintName(pgError.constraint);
    details = `A record with this ${constraintName} already exists.`;
  }

  if (errorCode === ERROR_CODES.FOREIGN_KEY_VIOLATION) {
    details =
      "The referenced record doesn't exist or cannot be deleted because other records depend on it.";
  }

  if (errorCode === ERROR_CODES.NOT_NULL_VIOLATION && pgError.column) {
    details = `The field "${pgError.column}" is required.`;
  }

  return details;
}

function processPgError(
  pgError: PostgresErrorShape,
  isDev: boolean
): ProcessedError | null {
  const pgInfo = getPgErrorInfo(pgError);
  if (!pgInfo) {
    return null;
  }

  const { status: statusCode, code: errorCode } = pgInfo;
  const message = USER_FRIENDLY_MESSAGES[errorCode];
  const details = getPgErrorDetails(pgError, errorCode);

  return {
    statusCode,
    errorCode,
    message,
    details: isDev ? details : undefined,
  };
}

function processNetworkError(err: Error): ProcessedError {
  const errorCode = getNetworkErrorCode(err);
  return {
    statusCode: errorCode === ERROR_CODES.TIMEOUT ? 504 : 503,
    errorCode,
    message: USER_FRIENDLY_MESSAGES[errorCode],
  };
}

function processGenericStatusError(err: unknown): ProcessedError | null {
  if (!err || typeof err !== "object" || !("status" in err)) {
    return null;
  }

  const errWithStatus = err as { status: number; message?: string };
  if (typeof errWithStatus.status !== "number") {
    return null;
  }

  const statusCode = errWithStatus.status as ContentfulStatusCode;
  const errorCode = getErrorCodeFromStatus(statusCode);
  const message = USER_FRIENDLY_MESSAGES[errorCode];
  const details =
    errWithStatus.message && errWithStatus.message.length < 150
      ? errWithStatus.message
      : undefined;

  return { statusCode, errorCode, message, details };
}

function getDefaultError(): ProcessedError {
  return {
    statusCode: 500,
    errorCode: ERROR_CODES.INTERNAL_ERROR,
    message: USER_FRIENDLY_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
  };
}

// ============================================================================
// Main Error Processing
// ============================================================================

function processError(err: unknown, isDev: boolean): ProcessedError {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return processZodError(err);
  }

  // Handle HTTP exceptions (from Hono)
  if (err instanceof HTTPException) {
    return processHTTPException(err, isDev);
  }

  // Handle PostgreSQL errors
  const pgError = extractPgError(err);
  if (pgError) {
    const result = processPgError(pgError, isDev);
    if (result) {
      return result;
    }
  }

  // Handle network errors
  if (isNetworkError(err)) {
    return processNetworkError(err as Error);
  }

  // Handle generic errors with status codes
  const statusResult = processGenericStatusError(err);
  if (statusResult) {
    return statusResult;
  }

  // Fallback: return default error with optional details in dev mode
  const defaultResult = getDefaultError();
  if (err instanceof Error && isDev) {
    defaultResult.details = err.message;
  }

  return defaultResult;
}

// ============================================================================
// Main Error Handler
// ============================================================================

export const errorHandler: ErrorHandler = (err, c) => {
  const env = c.env?.NODE_ENV ?? process.env?.NODE_ENV ?? "development";
  const isDev = env !== "production";

  // Partner API / public claim routes use a distinct envelope contract —
  // see `docs/partners/connect/errors-and-limits.md` and PartnerApiError.
  if (err instanceof PartnerApiError) {
    return renderPartnerApiError(err, c);
  }

  const processed = processError(err, isDev);

  // Build the response
  const response: ErrorResponse = {
    success: false,
    error: {
      code: processed.errorCode,
      message: processed.message,
      ...(processed.details && { details: processed.details }),
      ...(processed.fields && { fields: processed.fields }),
      ...(isDev && err instanceof Error && { stack: err.stack }),
      ...(isDev && { raw: err instanceof Error ? err.message : String(err) }),
    },
  };

  // Log the error for debugging
  console.error(`[${processed.errorCode}] ${processed.statusCode}:`, {
    message: processed.message,
    details: processed.details,
    stack: err instanceof Error ? err.stack : undefined,
  });

  return c.json(response, processed.statusCode);
};

function renderPartnerApiError(
  err: PartnerApiError,
  c: Parameters<ErrorHandler>[1]
) {
  const requestId =
    c.res.headers.get("x-request-id") ?? c.req.header("x-request-id");

  const body: { error: Record<string, unknown> } = {
    error: {
      code: err.code,
      message: err.message,
      ...(err.field ? { field: err.field } : {}),
      ...(err.extra ?? {}),
      ...(requestId ? { request_id: requestId } : {}),
    },
  };

  console.info(
    `[partner_api_error] ${err.status} ${err.code}${err.field ? ` (${err.field})` : ""}: ${err.message}`
  );

  return c.json(body, err.status as ContentfulStatusCode);
}

// ============================================================================
// Not Found Handler
// ============================================================================

/**
 * Paths that belong to the partner-contract surface. 404s on these routes
 * must emit the partner envelope documented in
 * `docs/partners/connect/errors-and-limits.md` (snake_case `code`,
 * `request_id`, no `success` wrapper), not the generic dashboard envelope.
 */
const PARTNER_PATH_PREFIXES = ["/api/partner", "/api/public/claim"] as const;

function isPartnerPath(pathname: string): boolean {
  return PARTNER_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export const notFound: NotFoundHandler = (c) => {
  const pathname = new URL(c.req.url).pathname;

  if (isPartnerPath(pathname)) {
    const requestId =
      c.res.headers.get("x-request-id") ?? c.req.header("x-request-id");
    const body: { error: Record<string, unknown> } = {
      error: {
        code: "not_found",
        message: `The endpoint ${c.req.method} ${pathname} does not exist.`,
        ...(requestId ? { request_id: requestId } : {}),
      },
    };
    return c.json(body, 404);
  }

  const response: ErrorResponse = {
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: USER_FRIENDLY_MESSAGES[ERROR_CODES.NOT_FOUND],
      details: `The endpoint ${c.req.method} ${pathname} does not exist.`,
    },
  };

  return c.json(response, 404);
};

// ============================================================================
// Exports for use in routes
// ============================================================================

export { ERROR_CODES, USER_FRIENDLY_MESSAGES };
export type { ErrorCode, ErrorResponse, ZodFieldError };
