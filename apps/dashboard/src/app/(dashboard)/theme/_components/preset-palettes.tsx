import { THEME_PRESETS } from "@/app/(public-menu)/m/[venueSlug]/[menuSlug]/_utils/menu-theme";

interface PresetPalettesProps {
  currentTheme: Record<string, unknown>;
  onApplyPreset: (colors: Record<string, string>) => void;
}

export function PresetPalettes({
  currentTheme,
  onApplyPreset,
}: PresetPalettesProps) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-semibold text-base">Palette Predefinite</h3>
        <p className="mt-0.5 text-muted-foreground text-sm">
          Scegli una palette per iniziare, poi personalizza i singoli colori.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {THEME_PRESETS.map((preset) => {
          const isActive = Object.entries(preset.colors).every(
            ([key, val]) =>
              String(currentTheme[key] ?? "").toLowerCase() ===
              val.toLowerCase()
          );

          const swatches = [
            preset.colors.primaryColor,
            preset.colors.backgroundColor,
            preset.colors.textColor,
            preset.colors.accentColor,
            preset.colors.priceColor,
          ];

          return (
            <button
              className={`group relative flex cursor-pointer flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all hover:border-foreground/30 hover:shadow-sm ${
                isActive ? "border-foreground ring-1 ring-foreground/20" : ""
              }`}
              key={preset.name}
              onClick={() =>
                onApplyPreset(
                  preset.colors as unknown as Record<string, string>
                )
              }
              type="button"
            >
              <div className="flex gap-1">
                {swatches.map((color, index) => (
                  <div
                    className="size-5 rounded-full border border-black/10"
                    key={`${index}-${color}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div>
                <p className="font-medium text-sm leading-none">
                  {preset.name}
                </p>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  {preset.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
