import { client } from "@/lib/api";

export const $getTranslationStats = client.api.manage.translations.stats.$get;
export const $getTranslationStatus = client.api.manage.translations.status.$get;
export const $translate = client.api.manage.translations.translate.$post;

type GetStatsResult = Awaited<ReturnType<typeof $getTranslationStats>>;
export type TranslationStatsResponse = Awaited<
  ReturnType<GetStatsResult["json"]>
>;
export type TranslationStats = TranslationStatsResponse["data"];

type GetStatusResult = Awaited<ReturnType<typeof $getTranslationStatus>>;
export type TranslationStatusResponse = Awaited<
  ReturnType<GetStatusResult["json"]>
>;
export type ActiveTranslationJob = NonNullable<
  TranslationStatusResponse["data"]["job"]
>;
