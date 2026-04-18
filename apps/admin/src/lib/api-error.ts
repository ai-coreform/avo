import { toast } from "sonner";
import { handleLogout } from "@/lib/auth/logout";

export interface ZodFieldError {
  field: string;
  message: string;
}

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

export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  UNIQUE_VIOLATION: "UNIQUE_VIOLATION",
  FOREIGN_KEY_VIOLATION: "FOREIGN_KEY_VIOLATION",
  NOT_NULL_VIOLATION: "NOT_NULL_VIOLATION",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
} as const;

const FALLBACK_MESSAGES: Record<string, string> = {
  [ERROR_CODES.VALIDATION_ERROR]: "Please check your input and try again.",
  [ERROR_CODES.BAD_REQUEST]:
    "We couldn't process your request. Please try again.",
  [ERROR_CODES.UNAUTHORIZED]: "Please sign in to continue.",
  [ERROR_CODES.FORBIDDEN]: "You don't have permission to do this.",
  [ERROR_CODES.NOT_FOUND]: "The requested resource was not found.",
  [ERROR_CODES.CONFLICT]: "This item already exists.",
  [ERROR_CODES.TOO_MANY_REQUESTS]: "Too many requests. Please wait a moment.",
  [ERROR_CODES.INTERNAL_ERROR]: "Something went wrong. Please try again later.",
  [ERROR_CODES.SERVICE_UNAVAILABLE]:
    "Service temporarily unavailable. Please try again.",
  [ERROR_CODES.NETWORK_ERROR]: "Network error. Please check your connection.",
  [ERROR_CODES.TIMEOUT]: "Request timed out. Please try again.",
};

const DEFAULT_ERROR_MESSAGE = "An unexpected error occurred. Please try again.";

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

export function parseError(error: unknown): ParsedError {
  if (!error) {
    return { code: "UNKNOWN", message: DEFAULT_ERROR_MESSAGE };
  }

  if (error instanceof ApiError) {
    return {
      code: error.code || getCodeFromStatus(error.status),
      message: error.message,
      details: error.details,
      fields: error.fields,
      status: error.status,
    };
  }

  let status: number | undefined;
  if (typeof error === "object") {
    const errObj = error as ErrorWithStatus;
    status = errObj.status || errObj.statusCode;
  }

  if (error instanceof Error) {
    return {
      code: getCodeFromStatus(status),
      message: error.message || DEFAULT_ERROR_MESSAGE,
      status,
    };
  }

  return {
    code: "UNKNOWN",
    message: typeof error === "string" ? error : DEFAULT_ERROR_MESSAGE,
    status,
  };
}

export function getUserFriendlyMessage(
  code: string,
  message: string,
  details?: string
): string {
  if (details) {
    return details;
  }
  if (message && !message.includes("Error:") && message.length < 200) {
    return message;
  }
  return FALLBACK_MESSAGES[code] || message || DEFAULT_ERROR_MESSAGE;
}

export function isUnauthorizedError(error: unknown): boolean {
  const parsed = parseError(error);
  return parsed.status === 401 || parsed.code === ERROR_CODES.UNAUTHORIZED;
}

export function handleUnauthorizedError(): void {
  handleLogout().catch((err) => {
    console.error("Error during automatic logout:", err);
  });
}

export function showErrorToast(error: unknown): void {
  const parsed = parseError(error);
  const message = getUserFriendlyMessage(
    parsed.code,
    parsed.message,
    parsed.details
  );

  if (parsed.fields && parsed.fields.length > 0) {
    const fieldMessages = parsed.fields
      .slice(0, 3)
      .map((f) => `- ${f.field}: ${f.message}`)
      .join("\n");

    toast.error(message, {
      description: fieldMessages,
      duration: 5000,
    });
    return;
  }

  toast.error(message);
}
