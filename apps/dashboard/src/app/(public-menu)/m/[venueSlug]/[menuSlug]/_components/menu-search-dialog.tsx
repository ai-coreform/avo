"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PublicMenuEntry } from "@/api/public-menu/types";
import { useTranslation } from "../_hooks/use-translation-context";
import { formatPrice } from "../_utils/format-price";
import { ItemDetailSheet } from "./item-detail-sheet";

interface MenuSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onSearch: (query: string) => void;
  results: PublicMenuEntry[];
}

export function MenuSearchDialog({
  isOpen,
  onClose,
  query,
  onSearch,
  results,
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
      {/* Search header */}
      <div
        className="flex shrink-0 items-center gap-3 border-b p-4"
        style={{ borderColor: "var(--menu-border)" }}
      >
        <Search
          className="h-5 w-5 shrink-0"
          style={{ color: "var(--menu-text)", opacity: 0.4 }}
        />
        <input
          className="flex-1 border-none bg-transparent font-sans text-base outline-none"
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Cerca nel menu..."
          ref={inputRef}
          style={{ color: "var(--menu-text)" }}
          type="text"
          value={query}
        />
        <button
          aria-label="Chiudi ricerca"
          className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-80"
          onClick={onClose}
          style={{
            backgroundColor: "var(--menu-accent)",
            color: "var(--menu-text)",
          }}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {query.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p
              className="font-sans text-sm"
              style={{ color: "var(--menu-text)", opacity: 0.4 }}
            >
              Digita per cercare piatti, ingredienti...
            </p>
          </div>
        )}

        {query.length > 0 && results.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p
                className="font-bold font-display text-lg"
                style={{ color: "var(--menu-text)" }}
              >
                Nessun risultato
              </p>
              <p
                className="mt-1 font-sans text-sm"
                style={{ color: "var(--menu-text)", opacity: 0.5 }}
              >
                Prova con un termine diverso
              </p>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-1">
            {results.map((entry) => (
              <SearchResultRow entry={entry} key={entry.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultRow({ entry }: { entry: PublicMenuEntry }) {
  const t = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const title = t(entry.id, "title", entry.title);
  const description =
    t(entry.id, "description", entry.description ?? "") || null;

  return (
    <>
      <button
        className="flex w-full cursor-pointer items-center justify-between rounded-lg p-3 text-left transition-opacity hover:opacity-80"
        onClick={() => setSheetOpen(true)}
        style={{ backgroundColor: "var(--menu-card-bg)" }}
        type="button"
      >
        <div className="min-w-0 flex-1">
          <p
            className="truncate font-display font-semibold text-sm uppercase"
            style={{ color: "var(--menu-text)" }}
          >
            {title}
          </p>
          {description && (
            <p
              className="truncate font-sans text-xs"
              style={{
                color: "var(--menu-text)",
                opacity: 0.5,
              }}
            >
              {description}
            </p>
          )}
        </div>
        {entry.price != null && (
          <span
            className="ml-3 shrink-0 font-display font-semibold text-sm"
            style={{
              color: "var(--menu-price, var(--menu-primary))",
            }}
          >
            {formatPrice(entry.price)}
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
