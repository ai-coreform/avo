import type { InferRequestType } from "hono/client";
import { client } from "@/lib/api";

const promosBase = client.api.manage.menus[":menuSlug"].promos;

export const $getPromos = promosBase.$get;
export const $createPromo = promosBase.$post;
export const $updatePromo = promosBase[":promoId"].$patch;
export const $deletePromo = promosBase[":promoId"].$delete;
export const $sortPromos = promosBase.sort.$put;

type GetPromosResult = Awaited<
  ReturnType<Awaited<ReturnType<typeof $getPromos>>["json"]>
>;
export type PromoListItem = GetPromosResult["data"][number];
export type PromoComponent = PromoListItem["components"][number];
export type PromoSchedule = PromoListItem["schedules"][number];

export type CreatePromoInput = InferRequestType<typeof $createPromo>["json"];
export type UpdatePromoInput = InferRequestType<typeof $updatePromo>["json"];
