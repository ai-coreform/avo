import type {
  AutocompleteParams,
  PlaceAutocompleteResponse,
  PlaceDetails,
  PlaceDetailsParams,
} from "./types";
import {
  AUTOCOMPLETE_FIELD_MASK,
  buildHeaders,
  buildPlaceDetailsSearchParams,
  GOOGLE_PLACES_BASE_URL,
  parseJsonResponse,
} from "./utils";

const REQUEST_TIMEOUT_MS = 1500;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const RETRY_DELAY_MS = 150;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_PLACES_API_KEY environment variable is required");
  }
  return key;
}

class GooglePlacesServiceImpl {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = getApiKey();
  }

  private async fetchWithTimeout(url: string, init: RequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Google Places request timed out");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async requestWithRetry(url: string, init: RequestInit) {
    const response = await this.fetchWithTimeout(url, init);
    if (!RETRYABLE_STATUS_CODES.has(response.status)) {
      return response;
    }

    await sleep(RETRY_DELAY_MS);

    return this.fetchWithTimeout(url, init);
  }

  async fetchAutocomplete(
    params: AutocompleteParams
  ): Promise<PlaceAutocompleteResponse> {
    const url = `${GOOGLE_PLACES_BASE_URL}/places:autocomplete`;

    const body = {
      input: params.input,
      sessionToken: params.sessionToken,
      languageCode: params.languageCode,
      regionCode: params.regionCode,
      includedPrimaryTypes: params.includedPrimaryTypes,
      locationBias: params.locationBias
        ? {
            circle: {
              center: {
                latitude: params.locationBias.latitude,
                longitude: params.locationBias.longitude,
              },
              radius: params.locationBias.radiusMeters,
            },
          }
        : undefined,
    };

    const response = await this.requestWithRetry(url, {
      method: "POST",
      headers: buildHeaders(this.apiKey, AUTOCOMPLETE_FIELD_MASK),
      body: JSON.stringify(body),
    });

    return parseJsonResponse<PlaceAutocompleteResponse>(
      response,
      "Failed to fetch place autocomplete suggestions"
    );
  }

  async fetchDetails(params: PlaceDetailsParams): Promise<PlaceDetails> {
    const searchParams = buildPlaceDetailsSearchParams(params);

    const url = `${GOOGLE_PLACES_BASE_URL}/places/${encodeURIComponent(
      params.placeId
    )}?${searchParams.toString()}`;

    const response = await this.requestWithRetry(url, {
      method: "GET",
      headers: buildHeaders(this.apiKey),
    });

    return parseJsonResponse<PlaceDetails>(
      response,
      "Failed to fetch place details"
    );
  }
}

export const googlePlacesService = new GooglePlacesServiceImpl();
