import type { InferRequestType, InferResponseType } from "hono/client";
import { client } from "@/lib/api";

export const $getVenue = client.api.manage.venue.$get;
export const $updateVenue = client.api.manage.venue.$patch;

export type GetVenueResponse = InferResponseType<typeof $getVenue>;
export type VenueData = GetVenueResponse["data"];

export type UpdateVenueInput = InferRequestType<typeof $updateVenue>["json"];
export type UpdateVenueResponse = InferResponseType<typeof $updateVenue>;
