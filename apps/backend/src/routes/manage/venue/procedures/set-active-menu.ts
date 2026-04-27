import type { Context } from "hono";
import { setActiveMenu } from "@/operations/venue/set-active-menu";
import type { SetActiveMenuInput } from "../venue.schemas";

export async function setActiveMenuProcedure(
  c: Context,
  input: SetActiveMenuInput
) {
  const member = c.get("member");

  const result = await setActiveMenu({
    venueId: member.venueId,
    menuId: input.menuId,
  });

  return c.json({
    data: {
      activeMenuId: result.activeMenuId,
    },
  });
}
