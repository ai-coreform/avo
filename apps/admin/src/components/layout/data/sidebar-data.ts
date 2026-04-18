import { BarChart3, Store, Users } from "lucide-react";
import type { SidebarData } from "../types";

export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: "Piattaforma",
      items: [
        {
          title: "Panoramica",
          url: "/",
          icon: BarChart3,
        },
        {
          title: "Utenti",
          url: "/users",
          icon: Users,
        },
        {
          title: "Venues",
          url: "/venues",
          icon: Store,
        },
      ],
    },
  ],
};
