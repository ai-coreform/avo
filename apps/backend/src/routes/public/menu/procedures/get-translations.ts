import type { Context } from "hono";
import { getTranslations } from "@/operations/public-menu/get-translations";
import type { TranslationParams } from "../menu.schemas";

export async function get(c: Context, params: TranslationParams) {
  const data = await getTranslations(
    params.venueSlug,
    params.menuSlug,
    params.locale
  );

  return c.json({ data });
}
