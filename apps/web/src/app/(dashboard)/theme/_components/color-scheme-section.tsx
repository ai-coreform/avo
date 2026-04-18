import {
  type MenuTheme,
  PROMO_GRADIENT_PRESETS,
} from "@/app/(public-menu)/m/[venueSlug]/[menuSlug]/_utils/menu-theme";
import { ColorPicker } from "./color-picker";

interface ColorSchemeSectionProps {
  theme: MenuTheme;
  onUpdateTheme: <K extends keyof MenuTheme>(
    key: K,
    value: MenuTheme[K]
  ) => void;
}

export function ColorSchemeSection({
  theme,
  onUpdateTheme,
}: ColorSchemeSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-semibold text-base">Schema Colori</h3>
        <p className="mt-0.5 text-muted-foreground text-sm">
          Personalizza ogni aspetto cromatico del tuo menu.
        </p>
      </div>

      {/* Main Colors */}
      <div className="space-y-2">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Colori principali
        </p>
        <div className="grid grid-cols-2 gap-4">
          <ColorPicker
            description="Pulsanti, tab attivi, badge"
            label="Colore Primario"
            onChange={(v) => onUpdateTheme("primaryColor", v)}
            value={theme.primaryColor}
          />
          <ColorPicker
            description="Colore del testo principale"
            label="Testo"
            onChange={(v) => onUpdateTheme("textColor", v)}
            value={theme.textColor}
          />
          <ColorPicker
            description="Colore dei prezzi nel menu"
            label="Prezzi"
            onChange={(v) => onUpdateTheme("priceColor", v)}
            value={theme.priceColor}
          />
          <ColorPicker
            description="Evidenziazioni e sfumature"
            label="Accento"
            onChange={(v) => onUpdateTheme("accentColor", v)}
            value={theme.accentColor}
          />
        </div>
      </div>

      {/* Borders & Tabs */}
      <div className="space-y-2 pt-2">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Bordi &amp; Tab
        </p>
        <div className="grid grid-cols-2 gap-4">
          <ColorPicker
            description="Colore dei bordi e separatori"
            label="Bordi"
            onChange={(v) => onUpdateTheme("borderColor", v)}
            value={theme.borderColor}
          />
          <ColorPicker
            description="Sfondo delle tab non selezionate"
            label="Sfondo Tab"
            onChange={(v) => onUpdateTheme("tabBg", v)}
            value={theme.tabBg}
          />
          <ColorPicker
            description="Testo della tab selezionata"
            label="Testo Tab Attivo"
            onChange={(v) => onUpdateTheme("tabActiveText", v)}
            value={theme.tabActiveText}
          />
          <ColorPicker
            description="Testo delle tab non selezionate"
            label="Testo Tab Inattivo"
            onChange={(v) => onUpdateTheme("tabText", v)}
            value={theme.tabText}
          />
        </div>
      </div>

      {/* Promo Gradient */}
      <div className="space-y-2 pt-2">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Gradiente Promo
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PROMO_GRADIENT_PRESETS.map((preset) => (
            <button
              className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border p-2 transition-all hover:border-foreground/30 ${
                theme.promoGradient === preset.value
                  ? "border-foreground ring-1 ring-foreground/20"
                  : ""
              }`}
              key={preset.name}
              onClick={() => onUpdateTheme("promoGradient", preset.value)}
              type="button"
            >
              <div
                className="h-3 w-full rounded-full"
                style={{ backgroundImage: preset.value }}
              />
              <span className="text-muted-foreground text-xs">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Backgrounds */}
      <div className="space-y-2 pt-2">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Sfondi
        </p>
        <div className="grid grid-cols-2 gap-4">
          <ColorPicker
            description="Colore di sfondo del menu"
            label="Sfondo Pagina"
            onChange={(v) => onUpdateTheme("backgroundColor", v)}
            value={theme.backgroundColor}
          />
          <ColorPicker
            description="Barra superiore con logo"
            label="Sfondo Intestazione"
            onChange={(v) => onUpdateTheme("headerBg", v)}
            value={theme.headerBg}
          />
          <ColorPicker
            description="Sfondo delle card promozioni"
            label="Sfondo Card"
            onChange={(v) => onUpdateTheme("cardBg", v)}
            value={theme.cardBg}
          />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 pt-2">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Dettagli
        </p>
        <div className="grid grid-cols-2 gap-4">
          <ColorPicker
            description="Colore dei badge allergeni"
            label="Allergeni"
            onChange={(v) => onUpdateTheme("allergenColor", v)}
            value={theme.allergenColor}
          />
          <ColorPicker
            description="Colore delle icone nei badge"
            label="Icone Allergeni"
            onChange={(v) => onUpdateTheme("allergenIconColor", v)}
            value={theme.allergenIconColor}
          />
        </div>
      </div>
    </section>
  );
}
