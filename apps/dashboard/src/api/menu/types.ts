import type { InferRequestType, InferResponseType } from "hono/client";
import { client } from "@/lib/api";

export const $createMenu = client.api.manage.menus.$post;
export const $getMenus = client.api.manage.menus.$get;
export const $getMenu = client.api.manage.menus[":menuSlug"].$get;
export const $getMenuEditor = client.api.manage.menus[":menuSlug"].editor.$get;
export const $updateMenu = client.api.manage.menus[":menuSlug"].$patch;
export const $updateMenuEditor =
  client.api.manage.menus[":menuSlug"].editor.$put;
export const $getMenuPreview =
  client.api.manage.menus[":menuSlug"].preview.$get;
export const $deleteMenu = client.api.manage.menus[":menuSlug"].$delete;

export type CreateMenuInput = InferRequestType<typeof $createMenu>["json"];
export type CreateMenuResponse = InferResponseType<typeof $createMenu>;
export type MenuStatus = NonNullable<CreateMenuInput["status"]>;

type GetMenusResult = Awaited<ReturnType<typeof $getMenus>>;
export type GetMenusResponse = Awaited<ReturnType<GetMenusResult["json"]>>;
export type MenuListItem = GetMenusResponse["data"][number];

export type GetMenuResponse = InferResponseType<typeof $getMenu>;
export type GetMenuEditorResponse = InferResponseType<typeof $getMenuEditor>;
export type MenuEditorData = GetMenuEditorResponse["data"];
export type MenuEditorTab = MenuEditorData["tabs"][number];
export type MenuEditorCategory = MenuEditorTab["categories"][number];
export type MenuEditorRow = MenuEditorCategory["rows"][number];
export type MenuEditorEntryRow = Extract<MenuEditorRow, { kind: "entry" }>;
export type MenuEditorGroupRow = Extract<MenuEditorRow, { kind: "group" }>;
export type MenuEntityTranslations = MenuEditorTab["translations"];
export type UpdateMenuInput = InferRequestType<typeof $updateMenu>["json"];
export type UpdateMenuResponse = InferResponseType<typeof $updateMenu>;
export type UpdateMenuEditorInput = InferRequestType<
  typeof $updateMenuEditor
>["json"];
export type UpdateMenuEditorResponse = InferResponseType<
  typeof $updateMenuEditor
>;
export type GetMenuPreviewResponse = InferResponseType<typeof $getMenuPreview>;
export type MenuPreviewData = GetMenuPreviewResponse["data"];
export type DeleteMenuResponse = InferResponseType<typeof $deleteMenu>;
