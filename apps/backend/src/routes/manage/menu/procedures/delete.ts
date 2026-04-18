import type { Context } from "hono";
import { deleteMenu } from "@/operations/menu/delete";
import { getMenu } from "@/operations/menu/get";
import { emitEvent } from "@/operations/partner/webhooks/events";
import type { MenuParams } from "../menu.schemas";

export async function remove(c: Context, params: MenuParams) {
  const member = c.get("member");

  const existing = await getMenu({
    venueId: member.venueId,
    menuSlug: params.menuSlug,
  });

  await deleteMenu({
    venueId: member.venueId,
    menuId: existing.id,
  });

  await emitEvent({
    venueId: member.venueId,
    eventType: "menu.deleted",
    source: "dashboard",
    resource: {
      type: "menu",
      avo_id: existing.id,
      external_id: existing.externalId ?? undefined,
    },
  });

  return c.json({
    success: true,
  });
}
