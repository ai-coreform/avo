import type { Context } from "hono";
import { getMenu } from "@/operations/menu/get";
import { updateMenuEditor } from "@/operations/menu-editor/update";
import { emitEvent } from "@/operations/partner/webhooks/events";
import type { UpdateMenuEditorPayload } from "../../editor.schemas";
import type { MenuParams } from "../../menu.schemas";

export async function update(
  c: Context,
  params: MenuParams,
  input: UpdateMenuEditorPayload
) {
  const member = c.get("member");

  const existing = await getMenu({
    venueId: member.venueId,
    menuSlug: params.menuSlug,
  });

  const editor = await updateMenuEditor({
    venueId: member.venueId,
    menuId: existing.id,
    input,
    sharedCatalogStrategy: input.sharedCatalogStrategy,
  });

  await emitEvent({
    venueId: member.venueId,
    eventType: "menu.updated",
    source: "dashboard",
    resource: {
      type: "menu",
      avo_id: existing.id,
      external_id: existing.externalId ?? undefined,
    },
  });

  return c.json({
    data: editor,
  });
}
