import type { InferResponseType } from "hono/client";
import { client } from "@/lib/api";

export const $autocomplete = client.api.manage.places.autocomplete.$post;
export const $resolve = client.api.manage.places.resolve[":placeId"].$get;

export type AutocompleteResponse = InferResponseType<typeof $autocomplete>;
export type AutocompleteData = AutocompleteResponse["data"];
export type AutocompleteSuggestion = AutocompleteData["suggestions"][number];

export type ResolveResponse = InferResponseType<typeof $resolve>;
export type AddressResolution = ResolveResponse["data"];
