import type { AppType } from "@avo/backend/types";
import { hc } from "hono/client";
import { API_BASE_URL } from "@/config/environment";
import { ApiError, isApiErrorResponse } from "./api-error";

/**
 * Custom fetch that throws on non-OK responses with proper error details
 */
const throwingFetch: typeof fetch = async (input, init) => {
  const res = await fetch(input, init);

  if (res.ok) {
    return res;
  }

  // Try to parse the error response from our API
  let errorMessage = "Request failed";
  let errorCode: string | undefined;
  let errorDetails: string | undefined;
  let errorFields: Array<{ field: string; message: string }> | undefined;

  try {
    const data = await res.json();

    // Handle our API error format
    if (isApiErrorResponse(data)) {
      errorMessage = data.error.message || errorMessage;
      errorCode = data.error.code;
      errorDetails = data.error.details;
      errorFields = data.error.fields;
    }
    // Handle other error formats
    else if (data) {
      errorMessage =
        (data as { error?: { message?: string } }).error?.message ||
        (data as { message?: string }).message ||
        errorMessage;
    }
  } catch {
    // If JSON parsing fails, try to get text
    try {
      const text = await res.text();
      if (text) {
        errorMessage = text;
      }
    } catch {
      // Ignore - use default message
    }
  }

  throw new ApiError(errorMessage, res.status, {
    code: errorCode,
    details: errorDetails,
    fields: errorFields,
  });
};

export const client = hc<AppType>(API_BASE_URL, {
  init: {
    credentials: "include",
  },
  fetch: throwingFetch,
});

/**
 * Client that uses relative URLs (goes through the Next.js rewrite).
 * Use this for public-facing pages so they work from any network device,
 * not just localhost.
 */
export const publicClient = hc<AppType>("", {
  fetch: throwingFetch,
});

export const wsClient = hc<AppType>(API_BASE_URL);
