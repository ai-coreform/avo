import {
  Languages,
  MessageCircle,
  Paintbrush,
  Store,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import type { SidebarData } from "../types";

export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: "AI",
      items: [
        {
          title: "Avo AI",
          url: "/chat",
          icon: MessageCircle,
        },
      ],
    },
    {
      title: "Catalogo",
      items: [
        {
          title: "Menu",
          url: "/menu",
          icon: UtensilsCrossed,
        },
        {
          title: "Traduzioni",
          url: "/translations",
          icon: Languages,
        },
        {
          title: "Personalizzazione",
          url: "/theme",
          icon: Paintbrush,
        },
      ],
    },
    {
      title: "Gestione",
      items: [
        {
          title: "La tua attività",
          url: "/venue",
          icon: Store,
        },
        {
          title: "Team",
          url: "/venue/team",
          icon: Users,
        },
      ],
    },
  ],
};
