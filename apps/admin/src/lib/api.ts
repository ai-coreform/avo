import type { AppType } from "@avo/backend/types";
import { hc } from "hono/client";
import { API_BASE_URL } from "@/config/environment";
import { ApiError, isApiErrorResponse } from "./api-error";

const throwingFetch: typeof fetch = async (input, init) => {
  const res = await fetch(input, init);

  if (res.ok) {
    return res;
  }

  let errorMessage = "Request failed";
  let errorCode: string | undefined;
  let errorDetails: string | undefined;
  let errorFields: Array<{ field: string; message: string }> | undefined;

  try {
    const data = await res.json();

    if (isApiErrorResponse(data)) {
      errorMessage = data.error.message || errorMessage;
      errorCode = data.error.code;
      errorDetails = data.error.details;
      errorFields = data.error.fields;
    } else if (data) {
      errorMessage =
        (data as { error?: { message?: string } }).error?.message ||
        (data as { message?: string }).message ||
        errorMessage;
    }
  } catch {
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
