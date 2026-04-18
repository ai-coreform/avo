import type { Option } from "@/types/misc";
import type { MenuStatus } from "./types";

export const menuStatusMeta = {
  draft: {
    label: "Bozza",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
  published: {
    label: "Pubblicato",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  archived: {
    label: "Archiviato",
    className:
      "bg-zinc-100 text-zinc-600 dark:bg-zinc-500/15 dark:text-zinc-400",
  },
} as const satisfies Record<
  MenuStatus,
  {
    label: string;
    className: string;
  }
>;

export const menuStatusValues = Object.keys(menuStatusMeta) as [
  MenuStatus,
  ...MenuStatus[],
];

export const menuStatusOptions: Option[] = menuStatusValues.map((value) => ({
  value,
  label: menuStatusMeta[value].label,
}));

export function getMenuStatusLabel(status: MenuStatus) {
  return menuStatusMeta[status].label;
}

export function getMenuStatusClassName(status: MenuStatus) {
  return menuStatusMeta[status].className;
}
