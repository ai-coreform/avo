import type { Context } from "hono";
import { getFullMenu } from "@/operations/public-menu/get-full-menu";
import type { MenuParam } from "../menu.schemas";

export async function get(c: Context, params: MenuParam) {
  const data = await getFullMenu(params.venueSlug, params.menuSlug);

  return c.json({ data });
}
