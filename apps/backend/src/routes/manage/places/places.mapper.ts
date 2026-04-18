import type {
  PlaceAutocompleteResponse,
  PlaceDetails,
} from "@/lib/google-places/types";

type AddressComponent = NonNullable<PlaceDetails["addressComponents"]>[number];

export interface AddressAutocompleteSuggestion {
  placeId: string;
  label: string;
  mainText: string;
  secondaryText?: string;
  types: string[];
}

export interface AddressAutocompleteResponse {
  suggestions: AddressAutocompleteSuggestion[];
}

export interface AddressResolution {
  placeId: string;
  formattedAddress?: string;
  shortFormattedAddress?: string;
  line1?: string;
  line2?: string;
  streetNumber?: string;
  route?: string;
  city?: string;
  region?: string;
  regionCode?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  placeTypes?: string[];
}

function normalizeText(value?: string): string | undefined {
  const nextValue = value?.trim();
  return nextValue ? nextValue : undefined;
}

function getAddressComponentByType(
  components: PlaceDetails["addressComponents"],
  type: string
): AddressComponent | undefined {
  if (!components) {
    return;
  }

  for (const component of components) {
    if (component.types?.includes(type)) {
      return component;
    }
  }

  return;
}

function getLongText(
  components: PlaceDetails["addressComponents"],
  type: string
): string | undefined {
  return normalizeText(getAddressComponentByType(components, type)?.longText);
}

function getShortText(
  components: PlaceDetails["addressComponents"],
  type: string
): string | undefined {
  return normalizeText(getAddressComponentByType(components, type)?.shortText);
}

function toAddressLine(
  ...parts: Array<string | undefined>
): string | undefined {
  const value = parts.filter(Boolean).join(" ");
  return normalizeText(value);
}

function toDetailsCoordinate(value?: number): number | undefined {
  return Number.isFinite(value) ? value : undefined;
}

export function mapAutocompleteResponse(
  response: PlaceAutocompleteResponse
): AddressAutocompleteResponse {
  const suggestions: AddressAutocompleteSuggestion[] = [];

  for (const suggestion of response.suggestions ?? []) {
    const prediction = suggestion.placePrediction;
    if (!prediction?.placeId) {
      continue;
    }

    const rawText = normalizeText(prediction.text?.text);
    const mainText = normalizeText(prediction.structuredFormat?.mainText?.text);
    const secondaryText = normalizeText(
      prediction.structuredFormat?.secondaryText?.text
    );
    const composedLabel = normalizeText(
      [mainText, secondaryText].filter(Boolean).join(", ")
    );
    const label = composedLabel ?? rawText;

    if (!label) {
      continue;
    }

    suggestions.push({
      placeId: prediction.placeId,
      label,
      mainText: mainText ?? label,
      secondaryText,
      types: prediction.types ?? [],
    });
  }

  return { suggestions };
}

export function mapPlaceDetailsToAddress(
  details: PlaceDetails
): AddressResolution {
  const components = details.addressComponents;

  const streetNumber = getLongText(components, "street_number");
  const route = getLongText(components, "route");
  const premise = getLongText(components, "premise");
  const subpremise = getLongText(components, "subpremise");
  const floor = getLongText(components, "floor");
  const city =
    getLongText(components, "locality") ??
    getLongText(components, "postal_town") ??
    getLongText(components, "sublocality_level_1") ??
    getLongText(components, "administrative_area_level_2");
  const region = getLongText(components, "administrative_area_level_1");
  const regionCodeValue = getShortText(
    components,
    "administrative_area_level_1"
  );
  const postalCode = getLongText(components, "postal_code");
  const country = getLongText(components, "country");
  const countryCode = getShortText(components, "country");

  const line1 = toAddressLine(streetNumber, route) ?? premise;
  const line2 = normalizeText([subpremise, floor].filter(Boolean).join(", "));

  return {
    placeId: details.id,
    formattedAddress: normalizeText(details.formattedAddress),
    shortFormattedAddress: normalizeText(details.shortFormattedAddress),
    line1: line1 ?? normalizeText(details.shortFormattedAddress),
    line2,
    streetNumber,
    route,
    city,
    region,
    regionCode: regionCodeValue,
    postalCode,
    country,
    countryCode,
    latitude: toDetailsCoordinate(details.location?.latitude),
    longitude: toDetailsCoordinate(details.location?.longitude),
    placeTypes: details.types ?? [],
  };
}
