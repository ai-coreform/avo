import type { PlaceDetailsParams } from "./types";

export const GOOGLE_PLACES_BASE_URL = "https://places.googleapis.com/v1";

export const AUTOCOMPLETE_FIELD_MASK = [
  "suggestions.placePrediction.placeId",
  "suggestions.placePrediction.text",
  "suggestions.placePrediction.structuredFormat",
  "suggestions.placePrediction.types",
].join(",");

export const DEFAULT_PLACE_FIELDS = [
  "id",
  "formattedAddress",
  "shortFormattedAddress",
  "addressComponents",
  "location",
  "types",
].join(",");

const ALLOWED_PLACE_DETAIL_FIELDS = new Set([
  "id",
  "formattedAddress",
  "shortFormattedAddress",
  "addressComponents",
  "location",
  "types",
]);

export function buildHeaders(
  apiKey: string,
  fieldMask?: string
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
  };

  if (fieldMask) {
    headers["X-Goog-FieldMask"] = fieldMask;
  }

  return headers;
}

export async function parseJsonResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  interface ErrorResponsePayload {
    error?: { message?: string };
    message?: string;
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const payload = isJson
    ? ((await response.json()) as ErrorResponsePayload)
    : null;

  if (!response.ok) {
    const message =
      payload?.error?.message ??
      payload?.message ??
      fallbackMessage ??
      "Failed to fetch data from Google Places";
    throw new Error(message);
  }

  return (payload ?? {}) as T;
}

export function buildPlaceDetailsSearchParams(
  params: PlaceDetailsParams
): URLSearchParams {
  const searchParams = new URLSearchParams();
  const filteredFields = params.fields?.filter((field) =>
    ALLOWED_PLACE_DETAIL_FIELDS.has(field)
  );
  const fieldMask = filteredFields?.length
    ? filteredFields.join(",")
    : DEFAULT_PLACE_FIELDS;

  searchParams.set("fields", fieldMask);
  if (params.languageCode) {
    searchParams.set("languageCode", params.languageCode);
  }
  if (params.regionCode) {
    searchParams.set("regionCode", params.regionCode);
  }
  if (params.sessionToken) {
    searchParams.set("sessionToken", params.sessionToken);
  }

  return searchParams;
}
