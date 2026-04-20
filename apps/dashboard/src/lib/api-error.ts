import { toast } from "sonner";
import { handleLogout } from "@/lib/auth/logout";

// ============================================================================
// Types
// ============================================================================

/**
 * Field error from Zod validation
 */
export interface ZodFieldError {
  field: string;
  message: string;
}

/**
 * API error response shape from the backend
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
    fields?: ZodFieldError[];
  };
}

type ErrorWithStatus = Error & {
  status?: number;
  statusCode?: number;
};

interface ParsedError {
  code: string;
  message: string;
  details?: string;
  fields?: ZodFieldError[];
  status?: number;
}

// ============================================================================
// ApiError Class
// ============================================================================

/**
 * Custom error class that preserves API error details
 */
export class ApiError extends Error {
  status: number;
  code?: string;
  details?: string;
  fields?: ZodFieldError[];

  constructor(
    message: string,
    status: number,
    options?: {
      code?: string;
      details?: string;
      fields?: ZodFieldError[];
    }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = options?.code;
    this.details = options?.details;
    this.fields = options?.fields;
  }
}

// ============================================================================
// Error Codes (matching backend)
// ============================================================================

export const ERROR_CODES = {
  // Client errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",

  // Database errors
  UNIQUE_VIOLATION: "UNIQUE_VIOLATION",
  FOREIGN_KEY_VIOLATION: "FOREIGN_KEY_VIOLATION",
  NOT_NULL_VIOLATION: "NOT_NULL_VIOLATION",

  // Server errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
} as const;

// ============================================================================
// User-friendly fallback messages
// ============================================================================

const FALLBACK_MESSAGES: Record<string, string> = {
  [ERROR_CODES.VALIDATION_ERROR]: "Please check your input and try again.",
  [ERROR_CODES.BAD_REQUEST]:
    "We couldn't process your request. Please try again.",
  [ERROR_CODES.UNAUTHORIZED]: "Please sign in to continue.",
  [ERROR_CODES.FORBIDDEN]: "You don't have permission to do this.",
  [ERROR_CODES.NOT_FOUND]: "The requested resource was not found.",
  [ERROR_CODES.CONFLICT]: "This item already exists.",
  [ERROR_CODES.TOO_MANY_REQUESTS]: "Too many requests. Please wait a moment.",
  [ERROR_CODES.UNIQUE_VIOLATION]:
    "This item already exists. Please use different values.",
  [ERROR_CODES.FOREIGN_KEY_VIOLATION]:
    "This operation references data that doesn't exist.",
  [ERROR_CODES.NOT_NULL_VIOLATION]: "A required field is missing.",
  [ERROR_CODES.INTERNAL_ERROR]: "Something went wrong. Please try again later.",
  [ERROR_CODES.SERVICE_UNAVAILABLE]:
    "Service temporarily unavailable. Please try again.",
  [ERROR_CODES.NETWORK_ERROR]: "Network error. Please check your connection.",
  [ERROR_CODES.TIMEOUT]: "Request timed out. Please try again.",
};

const DEFAULT_ERROR_MESSAGE = "An unexpected error occurred. Please try again.";

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if an object matches the API error response shape
 */
export function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  if (!data || typeof data !== "object") {
    return false;
  }

  const obj = data as Record<string, unknown>;
  if (obj.success !== false || !obj.error || typeof obj.error !== "object") {
    return false;
  }

  const errorObj = obj.error as Record<string, unknown>;
  return (
    typeof errorObj.code === "string" && typeof errorObj.message === "string"
  );
}

// ============================================================================
// Error Parsing
// ============================================================================

function getCodeFromStatus(status?: number): string {
  if (!status) {
    return "UNKNOWN";
  }

  const statusMap: Record<number, string> = {
    400: ERROR_CODES.BAD_REQUEST,
    401: ERROR_CODES.UNAUTHORIZED,
    403: ERROR_CODES.FORBIDDEN,
    404: ERROR_CODES.NOT_FOUND,
    409: ERROR_CODES.CONFLICT,
    422: ERROR_CODES.VALIDATION_ERROR,
    429: ERROR_CODES.TOO_MANY_REQUESTS,
    500: ERROR_CODES.INTERNAL_ERROR,
    503: ERROR_CODES.SERVICE_UNAVAILABLE,
    504: ERROR_CODES.TIMEOUT,
  };

  return statusMap[status] || "UNKNOWN";
}

function parseApiError(error: ApiError): ParsedError {
  return {
    code: error.code || getCodeFromStatus(error.status),
    message: error.message,
    details: error.details,
    fields: error.fields,
    status: error.status,
  };
}

function parseApiErrorResponse(
  error: ApiErrorResponse,
  status?: number
): ParsedError {
  return {
    code: error.error.code,
    message: error.error.message,
    details: error.error.details,
    fields: error.error.fields,
    status,
  };
}

function parseJsonMessage(
  message: string,
  status?: number
): ParsedError | null {
  try {
    const parsed = JSON.parse(message);
    if (isApiErrorResponse(parsed)) {
      return parseApiErrorResponse(parsed, status);
    }
  } catch {
    // Not JSON
  }
  return null;
}

/**
 * Extract error information from various error shapes
 */
export function parseError(error: unknown): ParsedError {
  // Handle null/undefined
  if (!error) {
    return { code: "UNKNOWN", message: DEFAULT_ERROR_MESSAGE };
  }

  // Handle our custom ApiError class
  if (error instanceof ApiError) {
    return parseApiError(error);
  }

  // Try to extract status code from generic error
  let status: number | undefined;
  if (typeof error === "object") {
    const errObj = error as ErrorWithStatus;
    status = errObj.status || errObj.statusCode;
  }

  // Handle Error instances
  if (error instanceof Error) {
    const message = error.message;

    // Try to parse as JSON
    const jsonParsed = parseJsonMessage(message, status);
    if (jsonParsed) {
      return jsonParsed;
    }

    // Use the message directly if it's meaningful
    if (message && message !== "Request failed") {
      return {
        code: getCodeFromStatus(status),
        message,
        status,
      };
    }
  }

  // Handle plain API error response object
  if (isApiErrorResponse(error)) {
    return parseApiErrorResponse(error, status);
  }

  // Fallback for other error types
  if (error instanceof Error) {
    return {
      code: getCodeFromStatus(status),
      message: error.message || DEFAULT_ERROR_MESSAGE,
      status,
    };
  }

  // Last resort
  return {
    code: "UNKNOWN",
    message: typeof error === "string" ? error : DEFAULT_ERROR_MESSAGE,
    status,
  };
}

/**
 * Get a user-friendly message for an error
 */
export function getUserFriendlyMessage(
  code: string,
  message: string,
  details?: string
): string {
  // If we have details, prefer them for context
  if (details) {
    return details;
  }

  // If the message looks user-friendly (not too technical), use it
  if (message && !message.includes("Error:") && message.length < 200) {
    return message;
  }

  // Fall back to predefined messages
  return FALLBACK_MESSAGES[code] || message || DEFAULT_ERROR_MESSAGE;
}

// ============================================================================
// Error Handlers
// ============================================================================

/**
 * Check if error requires logout (unauthorized)
 */
export function isUnauthorizedError(error: unknown): boolean {
  const parsed = parseError(error);
  return parsed.status === 401 || parsed.code === ERROR_CODES.UNAUTHORIZED;
}

/**
 * Handle logout for unauthorized errors
 */
export function handleUnauthorizedError(): void {
  handleLogout().catch((err) => {
    console.error("Error during automatic logout:", err);
  });
}

/**
 * Show error toast with formatted message
 */
export function showErrorToast(error: unknown): void {
  const parsed = parseError(error);
  const message = getUserFriendlyMessage(
    parsed.code,
    parsed.message,
    parsed.details
  );

  // Show field errors if present (validation errors)
  if (parsed.fields && parsed.fields.length > 0) {
    const fieldMessages = parsed.fields
      .slice(0, 3) // Limit to 3 fields to avoid long toasts
      .map((f) => `• ${f.field}: ${f.message}`)
      .join("\n");

    toast.error(message, {
      description: fieldMessages,
      duration: 5000,
    });
    return;
  }

  // Show details as description if available
  if (parsed.details && parsed.details !== message) {
    toast.error(message, {
      description: parsed.details,
      duration: 5000,
    });
    return;
  }

  toast.error(message);
}
