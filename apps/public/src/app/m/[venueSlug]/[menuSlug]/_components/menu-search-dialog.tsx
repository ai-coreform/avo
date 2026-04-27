"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PublicMenuEntry } from "@/api/public-menu/types";
import type { SearchResultGroup } from "../_hooks/use-menu-search";
import { useTranslation } from "../_hooks/use-translation-context";
import { formatPrice } from "../_utils/format-price";
import { ItemDetailSheet } from "./item-detail-sheet";

interface MenuSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onSearch: (query: string) => void;
  groupedResults: SearchResultGroup[];
  totalResults: number;
}

export function MenuSearchDialog({
  isOpen,
  onClose,
  query,
  onSearch,
  groupedResults,
  totalResults,
}: MenuSearchDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "var(--menu-bg)" }}
    >
      {/* Header with close button and title */}
      <div
        className="flex shrink-0 items-center border-b px-4 py-3"
        style={{ borderColor: "var(--menu-border)" }}
      >
        <button
          aria-label="Chiudi ricerca"
          className="flex h-8 w-8 items-center justify-center"
          onClick={onClose}
          type="button"
        >
          <X className="h-5 w-5" style={{ color: "var(--menu-text)" }} />
        </button>
        <h2
          className="flex-1 text-center font-bold font-display text-lg"
          style={{ color: "var(--menu-text)" }}
        >
          Cerca nel menu
        </h2>
        {/* Spacer to balance the close button */}
        <div className="h-8 w-8" />
      </div>

      {/* Search input */}
      <div className="shrink-0 px-4 py-3">
        <div
          className="flex items-center gap-3 rounded-xl border px-4 py-3"
          style={{ borderColor: "var(--menu-border)" }}
        >
          <Search
            className="h-5 w-5 shrink-0"
            style={{ color: "var(--menu-text)", opacity: 0.35 }}
          />
          <input
            className="flex-1 border-none bg-transparent font-sans text-base outline-none placeholder:opacity-40"
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Cerca piatti, ingredienti..."
            ref={inputRef}
            style={{ color: "var(--menu-text)" }}
            type="text"
            value={query}
          />
          {query.length > 0 && (
            <button
              aria-label="Cancella ricerca"
              className="flex h-5 w-5 shrink-0 items-center justify-center"
              onClick={() => onSearch("")}
              type="button"
            >
              <X
                className="h-4 w-4"
                style={{ color: "var(--menu-text)", opacity: 0.4 }}
              />
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div
        className="h-px w-full"
        style={{ backgroundColor: "var(--menu-border)" }}
      />

      {/* Results area */}
      <div className="flex-1 overflow-y-auto">
        {/* Empty state: no query */}
        {query.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4">
            <Search
              className="h-12 w-12"
              style={{ color: "var(--menu-text)", opacity: 0.2 }}
            />
            <div className="text-center">
              <p
                className="font-display font-semibold text-lg"
                style={{ color: "var(--menu-text)", opacity: 0.3 }}
              >
                Inizia a cercare
              </p>
              <p
                className="mt-1 font-sans text-sm"
                style={{ color: "var(--menu-text)", opacity: 0.3 }}
              >
                Trova i tuoi piatti e bevande preferiti
              </p>
            </div>
          </div>
        )}

        {/* No results */}
        {query.length > 0 && totalResults === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4">
            <p
              className="font-bold font-display text-lg"
              style={{ color: "var(--menu-text)" }}
            >
              Nessun risultato
            </p>
            <p
              className="font-sans text-sm"
              style={{ color: "var(--menu-text)", opacity: 0.5 }}
            >
              Prova con un termine diverso
            </p>
          </div>
        )}

        {/* Results with count and category groups */}
        {totalResults > 0 && (
          <div className="px-4 py-3">
            {/* Result count */}
            <p
              className="mb-4 font-medium font-sans text-xs uppercase tracking-wider"
              style={{ color: "var(--menu-text)", opacity: 0.4 }}
            >
              {totalResults} risultat{totalResults === 1 ? "o" : "i"} trovat
              {totalResults === 1 ? "o" : "i"}
            </p>

            {/* Category groups */}
            <div className="space-y-6">
              {groupedResults.map((group) => (
                <CategoryGroup group={group} key={group.categoryName} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryGroup({ group }: { group: SearchResultGroup }) {
  const t = useTranslation();
  const categoryTitle = t(group.categoryId, "title", group.categoryName);

  return (
    <div>
      {/* Category header with line */}
      <div className="mb-3 flex items-center gap-3">
        <h3
          className="shrink-0 font-bold font-display text-lg lowercase"
          style={{ color: "var(--menu-text)" }}
        >
          {categoryTitle}.
        </h3>
        <div
          className="h-px flex-1"
          style={{
            backgroundColor: "var(--menu-primary, var(--menu-text))",
            opacity: 0.2,
          }}
        />
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {group.entries.map((entry) => (
          <SearchResultRow entry={entry} key={entry.id} />
        ))}
      </div>
    </div>
  );
}

function SearchResultRow({ entry }: { entry: PublicMenuEntry }) {
  const t = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const title = t(entry.id, "title", entry.title);
  const priceLabel = entry.priceLabel;

  return (
    <>
      <button
        className="flex w-full cursor-pointer items-baseline gap-2 text-left"
        onClick={() => setSheetOpen(true)}
        type="button"
      >
        <span
          className="shrink-0 font-bold font-display text-sm uppercase"
          style={{ color: "var(--menu-text)" }}
        >
          {title}
        </span>
        <span className="dotted-leader" />
        {entry.price != null && (
          <span className="flex shrink-0 items-baseline gap-1.5">
            <span
              className="font-display font-semibold text-sm"
              style={{ color: "var(--menu-text)" }}
            >
              {formatPrice(entry.price)}
            </span>
            {priceLabel && (
              <span
                className="font-sans text-xs"
                style={{ color: "var(--menu-text)", opacity: 0.5 }}
              >
                {priceLabel}
              </span>
            )}
          </span>
        )}
      </button>
      <ItemDetailSheet
        item={{ type: "entry", data: entry }}
        onOpenChange={setSheetOpen}
        open={sheetOpen}
      />
    </>
  );
}
