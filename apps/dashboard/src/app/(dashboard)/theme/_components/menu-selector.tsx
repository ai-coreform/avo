import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@avo/ui/components/ui/select";
import type { MenuListItem } from "@/api/menu/types";

interface MenuSelectorProps {
  menus: MenuListItem[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}

export function MenuSelector({
  menus,
  selectedSlug,
  onSelect,
}: MenuSelectorProps) {
  if (menus.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nessun menu disponibile. Crea un menu prima di personalizzare il tema.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-medium text-sm">Menu</p>
      <Select onValueChange={onSelect} value={selectedSlug ?? undefined}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Seleziona un menu" />
        </SelectTrigger>
        <SelectContent>
          {menus.map((m) => (
            <SelectItem key={m.id} value={m.slug}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
