import type { Context } from "hono";
import { getPreviewMenu } from "@/operations/public-menu/get-preview-menu";
import type { MenuParams } from "../menu.schemas";

export async function preview(c: Context, params: MenuParams) {
  const member = c.get("member");
  const data = await getPreviewMenu(member.venueId, params.menuSlug);

  return c.json({ data });
}
