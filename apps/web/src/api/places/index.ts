import { $autocomplete, $resolve } from "./types";

interface AutocompleteOptions {
  sessionToken?: string;
  languageCode?: string;
  regionCode?: string;
}

class PlacesApi {
  async autocomplete(input: string, options?: AutocompleteOptions) {
    const res = await $autocomplete({
      json: {
        input,
        sessionToken: options?.sessionToken,
        languageCode: options?.languageCode ?? "it",
        regionCode: options?.regionCode ?? "IT",
      },
    });
    return await res.json();
  }

  async resolve(
    placeId: string,
    options?: { sessionToken?: string; languageCode?: string }
  ) {
    const res = await $resolve({
      param: { placeId },
      query: {
        sessionToken: options?.sessionToken,
        languageCode: options?.languageCode ?? "it",
      },
    });
    return await res.json();
  }
}

export const placesApi = new PlacesApi();
