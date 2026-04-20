import {
  $getTranslationStats,
  $getTranslationStatus,
  $translate,
} from "./types";

class TranslationsApi {
  async getStats() {
    const res = await $getTranslationStats();
    return await res.json();
  }

  async getStatus() {
    const res = await $getTranslationStatus();
    return await res.json();
  }

  async translate(locales: string[], missingOnly = false) {
    const res = await $translate({
      json: { locales, missingOnly },
    });
    return await res.json();
  }
}

export const translationsApi = new TranslationsApi();
