"use client";

import type { PublicMenuEntry } from "@/api/public-menu/types";
import { useTranslation } from "../_hooks/use-translation-context";
import { MenuItemRow } from "./menu-item-row";

interface MenuItemListProps {
  entries: PublicMenuEntry[];
}

interface Group {
  id: string | null;
  title: string | null;
  entries: PublicMenuEntry[];
}

function groupEntries(entries: PublicMenuEntry[]): Group[] {
  const groups: Group[] = [];
  let currentGroup: Group = { id: null, title: null, entries: [] };

  for (const entry of entries) {
    if (entry.kind === "group") {
      if (currentGroup.entries.length > 0 || currentGroup.title != null) {
        groups.push(currentGroup);
      }
      currentGroup = { id: entry.id, title: entry.title, entries: [] };
    } else {
      currentGroup.entries.push(entry);
    }
  }

  if (currentGroup.entries.length > 0 || currentGroup.title != null) {
    groups.push(currentGroup);
  }

  return groups;
}

export function MenuItemList({ entries }: MenuItemListProps) {
  const t = useTranslation();
  const groups = groupEntries(entries);

  return (
    <div className="space-y-2">
      {groups.map((group, groupIndex) => {
        const groupTitle =
          group.id && group.title
            ? t(group.id, "title", group.title)
            : group.title;

        return (
          <div key={group.title ?? `ungrouped-${groupIndex}`}>
            {groupTitle && (
              <div
                className={`mb-1 flex items-center gap-4 ${groupIndex === 0 ? "pt-5" : "pt-10"}`}
              >
                <span
                  className="font-bold font-display text-2xl lowercase tracking-tight"
                  style={{ color: "var(--menu-text)" }}
                >
                  {groupTitle}
                  <span style={{ color: "var(--menu-primary)" }}>.</span>
                </span>
                <div
                  className="h-px flex-1"
                  style={{
                    backgroundColor: "var(--menu-border, var(--menu-accent))",
                  }}
                />
              </div>
            )}
            <div>
              {group.entries.map((entry) => (
                <MenuItemRow entry={entry} key={entry.id} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MenuItemListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }, (_, i) => `group-${i}`).map(
        (groupKey, groupIndex) => (
          <div key={groupKey}>
            <div
              className={`mb-1 flex items-center gap-4 ${groupIndex === 0 ? "pt-5" : "pt-10"}`}
            >
              <div className="h-7 w-28 animate-pulse rounded bg-current/10" />
              <div
                className="h-px flex-1"
                style={{ backgroundColor: "var(--menu-border)" }}
              />
            </div>
            <div>
              {Array.from({ length: 4 }, (_, i) => `item-${i}`).map(
                (itemKey, itemIndex) => (
                  <div className="-mx-2 px-2" key={itemKey}>
                    <div className="flex items-baseline pt-5 pb-0">
                      <div
                        className="h-4 shrink-0 animate-pulse rounded bg-current/10"
                        style={{ width: `${100 + itemIndex * 25}px` }}
                      />
                      <span className="dotted-leader" />
                      <div className="flex shrink-0 items-center gap-1.5">
                        <div className="h-4 w-12 animate-pulse rounded bg-current/10" />
                        <span className="inline-block w-4" />
                      </div>
                    </div>
                    <div className="mt-1 h-3.5 w-2/3 animate-pulse rounded bg-current/10 opacity-60" />
                  </div>
                )
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
