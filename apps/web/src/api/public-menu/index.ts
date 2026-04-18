import { $getPublicMenu, $getTranslations } from "./types";

class PublicMenuApi {
  async get(venueSlug: string, menuSlug: string) {
    const res = await $getPublicMenu({
      param: { venueSlug, menuSlug },
    });

    return await res.json();
  }

  async getTranslations(venueSlug: string, menuSlug: string, locale: string) {
    const res = await $getTranslations({
      param: { venueSlug, menuSlug, locale },
    });

    return await res.json();
  }
}

export const publicMenuApi = new PublicMenuApi();
