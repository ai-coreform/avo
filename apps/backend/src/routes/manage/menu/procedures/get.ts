import type { Context } from "hono";
import { getMenu } from "@/operations/menu/get";
import { serializeMenu } from "@/operations/menu/shared";
import type { MenuParams } from "../menu.schemas";

export async function get(c: Context, params: MenuParams) {
  const member = c.get("member");

  const selectedMenu = await getMenu({
    venueId: member.venueId,
    menuSlug: params.menuSlug,
  });

  return c.json({
    data: serializeMenu(selectedMenu),
  });
}
