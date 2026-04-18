/** Structured change info for the diff-style approval UI. */
export interface MutationChangeInfo {
  /** Short action label, e.g. "Aggiornamento prezzo" */
  actionLabel: string;
  /** Name of the item being changed */
  itemName: string;
  /** Individual field changes to display as a diff */
  changes: Array<{
    field: string;
    from?: string;
    to: string;
  }>;
  /** Visual variant for the action */
  variant: "update" | "add" | "remove";
}

type Args = Record<string, unknown>;

function formatPrice(value: unknown): string | undefined {
  if (typeof value === "number") {
    return `${value.toFixed(2)}€`;
  }
  return undefined;
}

function str(value: unknown): string | undefined {
  if (value == null || value === "") {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value ? "Si" : "No";
  }
  return String(value);
}

const FIELD_LABELS: Record<string, string> = {
  title: "Nome",
  description: "Descrizione",
  priceCents: "Prezzo",
  priceLabel: "Etichetta prezzo",
  shortDescription: "Descrizione breve",
  longDescription: "Descrizione lunga",
  promoPrice: "Prezzo promo",
  originalPrice: "Prezzo originale",
  imageUrl: "Immagine",
  badgeLabel: "Badge",
  isActive: "Attiva",
};

function formatFieldName(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

/** Try multiple keys for the item name, return first non-empty */
function findName(a: Args, ...keys: string[]): string {
  // Try explicit keys first
  for (const key of keys) {
    const val = str(a[key]);
    if (val) {
      return val;
    }
  }
  // Fallback: find any string arg that looks like a name (not an ID, not a number)
  for (const [key, value] of Object.entries(a)) {
    if (
      typeof value === "string" &&
      value.length > 0 &&
      !key.endsWith("_id") &&
      !UUID_RE.test(value)
    ) {
      return value;
    }
  }
  return "Elemento";
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function changesFromUpdates(
  a: Args,
  fallbackKey: string
): MutationChangeInfo["changes"] {
  const updates = (a.updates ?? {}) as Record<string, unknown>;
  const oldValues = (a.old_values ?? {}) as Record<string, unknown>;
  const changes = Object.entries(updates).map(([key, value]) => {
    const fromRaw = oldValues[key];
    const from =
      key === "priceCents" || key === "promoPrice" || key === "originalPrice"
        ? formatPrice(fromRaw)
        : str(fromRaw);
    const to =
      key === "priceCents" || key === "promoPrice" || key === "originalPrice"
        ? (formatPrice(value) ?? str(value) ?? "—")
        : (str(value) ?? "—");
    return { field: formatFieldName(key), from, to };
  });
  if (changes.length === 0 && a[fallbackKey]) {
    changes.push({
      field: "Modifiche",
      from: undefined,
      to: str(a[fallbackKey]) ?? "—",
    });
  }
  return changes;
}

function extractUpdatePrice(a: Args): MutationChangeInfo {
  const changes: MutationChangeInfo["changes"] = [];
  const from = formatPrice(a.old_price);
  const to = formatPrice(a.new_price);
  if (to) {
    changes.push({ field: "Prezzo", from, to });
  }
  return {
    actionLabel: "Aggiornamento prezzo",
    itemName: findName(a, "item_title", "item_id"),
    changes,
    variant: "update",
  };
}

function extractUpdateItem(a: Args): MutationChangeInfo {
  return {
    actionLabel: "Modifica elemento",
    itemName: findName(a, "item_title", "item_id"),
    changes: changesFromUpdates(a, "description_of_changes"),
    variant: "update",
  };
}

function extractAddItem(a: Args): MutationChangeInfo {
  const changes: MutationChangeInfo["changes"] = [];
  const cat = str(a.category_title);
  if (cat) {
    changes.push({ field: "Categoria", to: cat });
  }
  const price = formatPrice(a.price);
  if (price) {
    changes.push({ field: "Prezzo", to: price });
  }
  const desc = str(a.description);
  if (desc) {
    changes.push({ field: "Descrizione", to: desc });
  }
  return {
    actionLabel: "Nuovo elemento",
    itemName: findName(a, "title"),
    changes,
    variant: "add",
  };
}

function extractRemoveItem(a: Args): MutationChangeInfo {
  return {
    actionLabel: "Rimozione",
    itemName: findName(a, "item_title", "item_id"),
    changes: [],
    variant: "remove",
  };
}

function extractToggleActive(a: Args): MutationChangeInfo {
  const active = a.is_active;
  return {
    actionLabel: active ? "Attiva categoria" : "Disattiva categoria",
    itemName: findName(a, "category_title", "category_id"),
    changes: [
      {
        field: "Visibilita'",
        from: active ? "Nascosta" : "Visibile",
        to: active ? "Visibile" : "Nascosta",
      },
    ],
    variant: "update",
  };
}

function extractCreatePromo(a: Args): MutationChangeInfo {
  const changes: MutationChangeInfo["changes"] = [];
  const price = formatPrice(a.promoPrice);
  if (price) {
    changes.push({ field: "Prezzo promo", to: price });
  }
  const desc = str(a.shortDescription);
  if (desc) {
    changes.push({ field: "Descrizione", to: desc });
  }
  const orig = formatPrice(a.originalPrice);
  if (orig) {
    changes.push({ field: "Prezzo originale", to: orig });
  }
  return {
    actionLabel: "Nuova promozione",
    itemName: findName(a, "title"),
    changes,
    variant: "add",
  };
}

function extractUpdatePromo(a: Args): MutationChangeInfo {
  return {
    actionLabel: "Modifica promozione",
    itemName: findName(a, "promo_title", "promo_id"),
    changes: changesFromUpdates(a, "description_of_changes"),
    variant: "update",
  };
}

function extractDeletePromo(a: Args): MutationChangeInfo {
  return {
    actionLabel: "Eliminazione promozione",
    itemName: findName(a, "promo_title", "promo_id"),
    changes: [],
    variant: "remove",
  };
}

const EXTRACTORS: Record<string, (a: Args) => MutationChangeInfo> = {
  update_price: extractUpdatePrice,
  update_item: extractUpdateItem,
  add_item: extractAddItem,
  remove_item: extractRemoveItem,
  toggle_item_active: extractToggleActive,
  create_promo: extractCreatePromo,
  update_promo: extractUpdatePromo,
  delete_promo: extractDeletePromo,
};

/** Extract structured change information from tool args for diff display. */
export function extractMutationChanges(
  toolName: string,
  args: Record<string, unknown> | null | undefined
): MutationChangeInfo {
  const a = args ?? {};
  const extractor = EXTRACTORS[toolName];
  if (extractor) {
    return extractor(a);
  }
  return {
    actionLabel: toolName,
    itemName: "Elemento",
    changes: [],
    variant: "update",
  };
}
