import type {
  PublicMenuData,
  PublicMenuPromotion,
} from "@/api/public-menu/types";
import type { LocalMenuEditorState } from "./menu-editor-state";

function mapRow(
  row: LocalMenuEditorState["tabs"][number]["categories"][number]["rows"][number]
) {
  if (row.kind === "group") {
    return {
      id: row.id ?? row.localId,
      kind: "group" as const,
      title: row.title,
      description: null,
      price: null,
      priceLabel: null,
      imageUrl: null,
      allergens: [] as string[],
      features: [] as string[],
      additives: [] as string[],
    };
  }

  // Editor state stores prices as euro strings (e.g. "9.00" / "9,00").
  // The preview expects integer cents (same shape as the public menu API).
  // Note: `??` isn't safe here because the "no override" state is an empty
  // string, not null — so we check for trimmed emptiness explicitly.
  const override = parseEuroStringToCents(row.priceCentsOverride);
  const base = parseEuroStringToCents(row.priceCents);
  const price = override ?? base;

  return {
    id: row.id ?? row.localId,
    kind: "entry" as const,
    title: row.title,
    description: row.description || null,
    price,
    priceLabel: row.priceLabelOverride || row.priceLabel || null,
    imageUrl: null,
    allergens: row.allergens as string[],
    features: row.features as string[],
    additives: row.additives as string[],
  };
}

function parseEuroStringToCents(
  value: string | null | undefined
): number | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const euros = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(euros)) {
    return null;
  }
  return Math.round(euros * 100);
}

/**
 * Converts the menu editor local state into the PublicMenuData shape
 * that the public menu renderer expects. This allows the preview iframe
 * to display the current editor state in real-time.
 */
export function editorStateToPreviewData(
  state: LocalMenuEditorState,
  venue: {
    name: string;
    slug: string;
    logo?: string | null;
    defaultLocale: string;
  },
  promotions?: PublicMenuPromotion[]
): PublicMenuData {
  return {
    venue: {
      name: venue.name,
      slug: venue.slug,
      logo: venue.logo ?? null,
      defaultLocale: venue.defaultLocale,
      locales: [{ locale: venue.defaultLocale, isEnabled: true }],
    },
    menu: {
      id: state.menu.id,
      name: state.menu.name,
      slug: state.menu.slug,
      theme: state.menu.theme,
      tabs: state.tabs
        .filter((tab) => tab.isVisible)
        .map((tab) => ({
          id: tab.id ?? tab.localId,
          label: tab.label,
          slug: tab.slug || tab.label.toLowerCase().replace(/\s+/g, "-"),
          categories: tab.categories
            .filter((cat) => cat.isVisible)
            .map((cat) => ({
              id: cat.id ?? cat.localId,
              title: cat.title,
              slug: cat.title.toLowerCase().replace(/\s+/g, "-") || cat.localId,
              entries: cat.rows.filter((row) => row.isVisible).map(mapRow),
            })),
        })),
      promotions: promotions ?? [],
    },
  } as PublicMenuData;
}
