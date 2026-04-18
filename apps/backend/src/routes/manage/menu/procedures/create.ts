import type { Context } from "hono";
import { createMenu } from "@/operations/menu/create";
import { serializeMenu } from "@/operations/menu/shared";
import { emitEvent } from "@/operations/partner/webhooks/events";
import type { CreateMenuPayload } from "../menu.schemas";

export async function create(c: Context, input: CreateMenuPayload) {
  const member = c.get("member");

  const createdMenu = await createMenu({
    venueId: member.venueId,
    ...input,
  });

  await emitEvent({
    venueId: member.venueId,
    eventType: "menu.created",
    source: "dashboard",
    resource: {
      type: "menu",
      avo_id: createdMenu.id,
      external_id: createdMenu.externalId ?? undefined,
    },
  });

  return c.json(
    {
      data: serializeMenu(createdMenu),
    },
    201
  );
}
