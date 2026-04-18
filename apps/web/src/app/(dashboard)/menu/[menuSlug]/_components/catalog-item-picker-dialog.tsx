"use client";

import { Button } from "@avo/ui/components/ui/button";
import { Checkbox } from "@avo/ui/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@avo/ui/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@avo/ui/components/ui/dialog";
import { useMemo, useState } from "react";
import type { CatalogItemListItem } from "@/api/catalog-items/types";
import { useGetCatalogItems } from "@/api/catalog-items/use-get-catalog-items";

interface CatalogItemPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCatalogItemIds: Set<string>;
  onSelect: (items: CatalogItemListItem[]) => void;
}

export function CatalogItemPickerDialog({
  open,
  onOpenChange,
  existingCatalogItemIds,
  onSelect,
}: CatalogItemPickerDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: items = [], isLoading } = useGetCatalogItems();

  const filteredItems = useMemo(() => {
    if (!search.trim()) {
      return items;
    }
    const lower = search.toLowerCase();
    return items.filter((item) => item.title.toLowerCase().includes(lower));
  }, [items, search]);

  const hasConflicts = useMemo(() => {
    for (const id of selectedIds) {
      if (existingCatalogItemIds.has(id)) {
        return true;
      }
    }
    return false;
  }, [selectedIds, existingCatalogItemIds]);

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleConfirm() {
    const selected = items.filter((item) => selectedIds.has(item.id));
    onSelect(selected);
    setSelectedIds(new Set());
    setSearch("");
    onOpenChange(false);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setSelectedIds(new Set());
      setSearch("");
    }
    onOpenChange(open);
  }

  function formatPrice(priceCents: number | null) {
    if (priceCents === null) {
      return "";
    }
    return `${(priceCents / 100).toFixed(2)} \u20AC`;
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Aggiungi dal catalogo</DialogTitle>
          <DialogDescription>
            Seleziona le voci esistenti da aggiungere a questa categoria.
          </DialogDescription>
          {hasConflicts && (
            <p className="text-destructive text-sm">
              Alcune voci selezionate sono già presenti nel menu.
            </p>
          )}
        </DialogHeader>

        <Command className="flex-1 overflow-hidden" shouldFilter={false}>
          <CommandInput
            onValueChange={setSearch}
            placeholder="Cerca nel catalogo..."
            value={search}
          />
          <CommandList className="max-h-[40vh]">
            {isLoading ? (
              <div className="py-6 text-center text-muted-foreground text-sm">
                Caricamento...
              </div>
            ) : (
              <>
                <CommandEmpty>Nessun elemento trovato.</CommandEmpty>
                {filteredItems.map((item) => {
                  const isExisting = existingCatalogItemIds.has(item.id);
                  return (
                    <CommandItem
                      key={item.id}
                      onSelect={() => toggleItem(item.id)}
                      value={item.id}
                    >
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        className="mr-2 [&_svg]:text-white"
                      />
                      <div className="flex flex-1 items-center justify-between gap-2 overflow-hidden">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">
                            {item.title}
                          </span>
                          {isExisting && (
                            <span className="text-destructive text-xs">
                              Già presente nel menu
                            </span>
                          )}
                        </div>
                        {item.priceCents !== null && (
                          <span className="shrink-0 text-muted-foreground text-sm">
                            {formatPrice(item.priceCents)}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </>
            )}
          </CommandList>
        </Command>

        <DialogFooter>
          <Button onClick={() => handleOpenChange(false)} variant="outline">
            Annulla
          </Button>
          <Button disabled={selectedIds.size === 0} onClick={handleConfirm}>
            {selectedIds.size === 0
              ? "Seleziona voci"
              : `Aggiungi ${selectedIds.size} ${selectedIds.size === 1 ? "voce" : "voci"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
