import type { Context } from "hono";
import { getMenu } from "@/operations/menu/get";
import { serializeMenu } from "@/operations/menu/shared";
import { updateMenu } from "@/operations/menu/update";
import { emitEvent } from "@/operations/partner/webhooks/events";
import type { MenuParams, UpdateMenuPayload } from "../menu.schemas";

export async function update(
  c: Context,
  params: MenuParams,
  input: UpdateMenuPayload
) {
  const member = c.get("member");

  const existing = await getMenu({
    venueId: member.venueId,
    menuSlug: params.menuSlug,
  });

  const updatedMenu = await updateMenu({
    venueId: member.venueId,
    menuId: existing.id,
    ...input,
  });

  await emitEvent({
    venueId: member.venueId,
    eventType: "menu.updated",
    source: "dashboard",
    resource: {
      type: "menu",
      avo_id: updatedMenu.id,
      external_id: updatedMenu.externalId ?? undefined,
    },
  });

  return c.json({
    data: serializeMenu(updatedMenu),
  });
}
