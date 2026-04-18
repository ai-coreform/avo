export interface LocationBias {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface PredictionText {
  text: string;
  matches?: Array<{ startOffset: number; length: number }>;
}

export interface StructuredFormat {
  mainText?: PredictionText;
  secondaryText?: PredictionText;
}

export interface PlacePrediction {
  placeId: string;
  distanceMeters?: number;
  text?: PredictionText;
  structuredFormat?: StructuredFormat;
  types?: string[];
}

export interface PlaceSuggestion {
  placePrediction: PlacePrediction;
}

export interface PlaceAutocompleteResponse {
  suggestions: PlaceSuggestion[];
}

export interface PlaceDetails {
  id: string;
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  addressComponents?: Array<{
    longText?: string;
    shortText?: string;
    types?: string[];
    languageCode?: string;
  }>;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
}

export interface AutocompleteParams {
  input: string;
  sessionToken?: string;
  languageCode?: string;
  regionCode?: string;
  locationBias?: LocationBias;
  includedPrimaryTypes?: string[];
}

export interface PlaceDetailsParams {
  placeId: string;
  sessionToken?: string;
  languageCode?: string;
  regionCode?: string;
  fields?: string[];
}
