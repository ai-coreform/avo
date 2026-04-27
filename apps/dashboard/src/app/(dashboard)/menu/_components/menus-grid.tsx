import type { MenuListItem } from "@/api/menu/types";
import { MenuCard } from "./menu-card";

interface MenusGridProps {
  menus: MenuListItem[];
  venueSlug: string | null;
  activeMenuId: string | null;
}

export function MenusGrid({ menus, venueSlug, activeMenuId }: MenusGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {menus.map((menu) => (
        <MenuCard
          activeMenuId={activeMenuId}
          key={menu.id}
          menu={menu}
          venueSlug={venueSlug}
        />
      ))}
    </div>
  );
}
