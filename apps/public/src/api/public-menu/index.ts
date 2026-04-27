import { fetchPublicJson } from "@/lib/api";
import type { GetPublicMenuResponse, GetTranslationsResponse } from "./types";

class PublicMenuApi {
  async get(venueSlug: string, menuSlug: string) {
    const venue = encodeURIComponent(venueSlug);
    const menu = encodeURIComponent(menuSlug);

    return await fetchPublicJson<GetPublicMenuResponse>(
      `/api/public/menu/${venue}/${menu}`
    );
  }

  async getTranslations(venueSlug: string, menuSlug: string, locale: string) {
    const venue = encodeURIComponent(venueSlug);
    const menu = encodeURIComponent(menuSlug);
    const targetLocale = encodeURIComponent(locale);

    return await fetchPublicJson<GetTranslationsResponse>(
      `/api/public/menu/${venue}/${menu}/translations/${targetLocale}`
    );
  }
}

export const publicMenuApi = new PublicMenuApi();
