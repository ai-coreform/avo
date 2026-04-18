import type { InferResponseType } from "hono/client";
import { client } from "@/lib/api";

export const $getLocales = client.api.manage.locales.$get;
export const $addLocale = client.api.manage.locales.$post;
export const $deleteLocale = client.api.manage.locales[":locale"].$delete;
export const $reorderLocales = client.api.manage.locales.reorder.$patch;
export const $toggleLocale = client.api.manage.locales[":locale"].toggle.$patch;

type GetLocalesResult = Awaited<ReturnType<typeof $getLocales>>;
export type GetLocalesResponse = Awaited<ReturnType<GetLocalesResult["json"]>>;
export type VenueLocale = GetLocalesResponse["data"][number];

export type ToggleLocaleResponse = InferResponseType<typeof $toggleLocale>;
