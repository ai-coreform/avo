import {
  FONT_OPTIONS,
  getFontFamily,
  type MenuTheme,
} from "@avo/menu/menu-theme";
import { Label } from "@avo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@avo/ui/components/ui/select";

interface FontSectionProps {
  theme: MenuTheme;
  onUpdateTheme: <K extends keyof MenuTheme>(
    key: K,
    value: MenuTheme[K]
  ) => void;
}

export function FontSection({ theme, onUpdateTheme }: FontSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-semibold text-base">Font</h3>
        <p className="mt-0.5 text-muted-foreground text-sm">
          Scegli i font per titoli e testo del menu.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Font Titoli</Label>
          <Select
            onValueChange={(v) => onUpdateTheme("fontDisplay", v)}
            value={theme.fontDisplay}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  <span style={{ fontFamily: getFontFamily(f.value) }}>
                    {f.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Font Corpo</Label>
          <Select
            onValueChange={(v) => onUpdateTheme("fontBody", v)}
            value={theme.fontBody}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  <span style={{ fontFamily: getFontFamily(f.value) }}>
                    {f.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
