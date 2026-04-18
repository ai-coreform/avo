import { tool } from "ai";
import { z } from "zod";
import { executeTool } from "@/operations/chat/execute-tool";

export type MenuToolSet = ReturnType<typeof createMenuTools>;

export function createMenuTools(ctx: { venueId: string; menuContext: string }) {
  const { venueId, menuContext } = ctx;

  const runMutation = async (toolName: string, args: Record<string, unknown>) =>
    executeTool(venueId, toolName, args);

  return {
    get_menu_info: tool({
      description:
        "Recupera informazioni sul menu attuale. Usa quando l'utente chiede il prezzo di un elemento, cosa c'è in una categoria, ecc. NON usa questo tool per modifiche, solo per consultazione.",
      inputSchema: z.object({
        query: z.string().describe("La domanda dell'utente sul menu"),
      }),
      execute: async () => menuContext,
    }),

    update_price: tool({
      description:
        "Aggiorna il prezzo di un elemento del menu. Usa questo tool quando l'utente vuole cambiare il prezzo di un drink, una birra, una bibita o qualsiasi voce del menu. IMPORTANTE: leggi SEMPRE il prezzo attuale dal menu context e forniscilo come old_price.",
      inputSchema: z.object({
        item_id: z.string().describe("L'ID dell'elemento del menu"),
        item_title: z
          .string()
          .describe("Il nome dell'elemento come appare nel menu"),
        new_price: z.number().describe("Il nuovo prezzo in euro"),
        old_price: z
          .number()
          .describe(
            "Il prezzo ATTUALE dell'elemento in euro, letto dal menu. Obbligatorio."
          ),
      }),
      needsApproval: true,
      execute: async (args) =>
        runMutation("update_price", args as Record<string, unknown>),
    }),

    update_item: tool({
      description:
        "Aggiorna uno o piu' campi di un elemento del menu. Usa per cambiare titolo, descrizione o etichetta prezzo. Per cambiare solo il prezzo base, usa update_price. OBBLIGATORIO: old_values DEVE contenere i valori attuali letti dal menu context, con le stesse chiavi di updates. Esempio: updates={title:'Nuovo'}, old_values={title:'Vecchio'}.",
      inputSchema: z.object({
        item_id: z.string(),
        item_title: z.string(),
        updates: z
          .record(z.string(), z.unknown())
          .describe(
            "I campi da aggiornare. Includi solo i campi che devono cambiare."
          ),
        old_values: z
          .record(z.string(), z.unknown())
          .describe(
            "OBBLIGATORIO. I valori ATTUALI dei campi prima della modifica, letti dal menu context. DEVE avere le stesse chiavi di updates."
          ),
        description_of_changes: z.string(),
      }),
      needsApproval: true,
      execute: async (args) =>
        runMutation("update_item", args as Record<string, unknown>),
    }),

    add_item: tool({
      description:
        "Aggiunge un nuovo elemento al menu. Usa quando l'utente vuole aggiungere un nuovo drink, piatto, birra, ecc.",
      inputSchema: z.object({
        title: z.string(),
        category_id: z.string(),
        category_title: z.string(),
        price: z.number().optional(),
        description: z.string().optional(),
        priceLabel: z.string().optional(),
      }),
      needsApproval: true,
      execute: async (args) =>
        runMutation("add_item", args as Record<string, unknown>),
    }),

    remove_item: tool({
      description:
        "Rimuove un elemento dal menu. Usa quando l'utente vuole togliere un drink, una birra, ecc.",
      inputSchema: z.object({
        item_id: z.string(),
        item_title: z.string(),
      }),
      needsApproval: true,
      execute: async (args) =>
        runMutation("remove_item", args as Record<string, unknown>),
    }),

    toggle_item_active: tool({
      description:
        "Attiva o disattiva la visibilità di una categoria nel menu. Usa per nascondere o mostrare una categoria.",
      inputSchema: z.object({
        category_id: z.string(),
        category_title: z.string(),
        is_active: z.boolean(),
      }),
      needsApproval: true,
      execute: async (args) =>
        runMutation("toggle_item_active", args as Record<string, unknown>),
    }),

    create_promo: tool({
      description:
        "Crea una nuova promozione. Usa quando l'utente vuole aggiungere una nuova promo, offerta, o happy hour.",
      inputSchema: z.object({
        title: z.string(),
        shortDescription: z.string(),
        promoPrice: z.number(),
        originalPrice: z.number().optional(),
        isActive: z.boolean().optional(),
        imageUrl: z.string().optional(),
      }),
      needsApproval: true,
      execute: async (args) =>
        runMutation("create_promo", args as Record<string, unknown>),
    }),

    update_promo: tool({
      description:
        "Aggiorna una promozione esistente. Usa per cambiare prezzo, descrizione, o stato di una promo. OBBLIGATORIO: old_values DEVE contenere i valori attuali letti dal menu context, con le stesse chiavi di updates.",
      inputSchema: z.object({
        promo_id: z.string(),
        promo_title: z.string(),
        updates: z
          .record(z.string(), z.unknown())
          .describe(
            "I campi da aggiornare. Chiavi possibili: promoPrice, originalPrice, shortDescription, isActive, imageUrl, badgeLabel"
          ),
        old_values: z
          .record(z.string(), z.unknown())
          .describe(
            "OBBLIGATORIO. I valori ATTUALI dei campi prima della modifica, letti dal menu context. DEVE avere le stesse chiavi di updates."
          ),
        description_of_changes: z.string(),
      }),
      needsApproval: true,
      execute: async (args) =>
        runMutation("update_promo", args as Record<string, unknown>),
    }),

    delete_promo: tool({
      description:
        "Elimina una promozione dal menu. Usa quando l'utente vuole rimuovere una promo.",
      inputSchema: z.object({
        promo_id: z.string(),
        promo_title: z.string(),
      }),
      needsApproval: true,
      execute: async (args) =>
        runMutation("delete_promo", args as Record<string, unknown>),
    }),
  };
}

export const MUTATION_TOOL_NAMES = [
  "update_price",
  "update_item",
  "add_item",
  "remove_item",
  "toggle_item_active",
  "create_promo",
  "update_promo",
  "delete_promo",
] as const;

export type MutationToolName = (typeof MUTATION_TOOL_NAMES)[number];

export function isMutationToolName(name: string): name is MutationToolName {
  return (MUTATION_TOOL_NAMES as readonly string[]).includes(name);
}
