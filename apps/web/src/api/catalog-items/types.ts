import { client } from "@/lib/api";

export const $getCatalogItems = client.api.manage["catalog-items"].$get;

type GetCatalogItemsResult = Awaited<
  ReturnType<Awaited<ReturnType<typeof $getCatalogItems>>["json"]>
>;
export type CatalogItemListItem = GetCatalogItemsResult["data"][number];
