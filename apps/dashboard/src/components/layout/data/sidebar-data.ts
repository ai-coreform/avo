import {
  Bot,
  CalendarCheck,
  Globe,
  Languages,
  MessageCircle,
  Paintbrush,
  Printer,
  ShoppingCart,
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
        {
          title: "Cameriere AI",
          url: "#",
          icon: Bot,
          badge: "In Arrivo",
          disabled: true,
        },
      ],
    },
    {
      title: "Menu",
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
        {
          title: "Menu Cartaceo",
          url: "#",
          icon: Printer,
          badge: "In Arrivo",
          disabled: true,
        },
      ],
    },
    {
      title: "Operazioni",
      items: [
        {
          title: "Ordini",
          url: "#",
          icon: ShoppingCart,
          badge: "In Arrivo",
          disabled: true,
        },
        {
          title: "Prenotazioni",
          url: "#",
          icon: CalendarCheck,
          badge: "In Arrivo",
          disabled: true,
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
          title: "Sito Web",
          url: "#",
          icon: Globe,
          badge: "In Arrivo",
          disabled: true,
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
