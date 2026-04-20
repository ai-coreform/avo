import {
  $addLocale,
  $deleteLocale,
  $getLocales,
  $reorderLocales,
  $toggleLocale,
} from "./types";

class LocalesApi {
  async list() {
    const res = await $getLocales();
    return await res.json();
  }

  async add(locale: string) {
    const res = await $addLocale({ json: { locale } });
    return await res.json();
  }

  async remove(locale: string) {
    const res = await $deleteLocale({ param: { locale } });
    return await res.json();
  }

  async reorder(locales: string[]) {
    const res = await $reorderLocales({ json: { locales } });
    return await res.json();
  }

  async toggle(locale: string, isEnabled: boolean) {
    const res = await $toggleLocale({
      param: { locale },
      json: { isEnabled },
    });
    return await res.json();
  }
}

export const localesApi = new LocalesApi();
