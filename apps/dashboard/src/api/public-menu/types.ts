import type { InferResponseType } from "hono/client";
import { publicClient } from "@/lib/api";

export const $getPublicMenu =
  publicClient.api.public.menu[":venueSlug"][":menuSlug"].$get;
export const $getTranslations =
  publicClient.api.public.menu[":venueSlug"][":menuSlug"].translations[
    ":locale"
  ].$get;

export type GetPublicMenuResponse = InferResponseType<typeof $getPublicMenu>;
export type PublicMenuData = GetPublicMenuResponse["data"];
export type PublicMenuVenue = PublicMenuData["venue"];
export type PublicMenuMenu = PublicMenuData["menu"];
export type PublicMenuTab = PublicMenuMenu["tabs"][number];
export type PublicMenuCategory = PublicMenuTab["categories"][number];
export type PublicMenuEntry = PublicMenuCategory["entries"][number];
export type PublicMenuPromotion = PublicMenuMenu["promotions"][number];

export type GetTranslationsResponse = InferResponseType<
  typeof $getTranslations
>;
export type TranslationsData = GetTranslationsResponse["data"];
