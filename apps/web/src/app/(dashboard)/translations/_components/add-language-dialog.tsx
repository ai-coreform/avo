"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@avo/ui/components/ui/dialog";
import { Input } from "@avo/ui/components/ui/input";
import { Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ALL_LOCALE_CONFIGS } from "@/data/locale-configs";

interface AddLanguageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (code: string) => void;
  addedCodes: Set<string>;
  isBusy: boolean;
}

export function AddLanguageDialog({
  open,
  onOpenChange,
  onAdd,
  addedCodes,
  isBusy,
}: AddLanguageDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const availableToAdd = useMemo(
    () => ALL_LOCALE_CONFIGS.filter((l) => !addedCodes.has(l.code)),
    [addedCodes]
  );

  const filteredAvailable = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return availableToAdd;
    }
    return availableToAdd.filter(
      (l) =>
        l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
    );
  }, [availableToAdd, searchQuery]);

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setSearchQuery("");
        }
      }}
      open={open}
    >
      <DialogContent className="flex max-h-[80vh] flex-col bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">
            Aggiungi lingua
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            className="border-border pl-9 font-sans"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca lingua..."
            value={searchQuery}
          />
          {searchQuery ? (
            <button
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
              onClick={() => setSearchQuery("")}
              type="button"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <div className="-mx-6 max-h-[50vh] min-h-0 flex-1 overflow-y-auto px-6">
          {filteredAvailable.length === 0 ? (
            <div className="py-8 text-center font-sans text-[13px] text-muted-foreground">
              {searchQuery
                ? "Nessuna lingua trovata"
                : "Tutte le lingue sono già state aggiunte"}
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {filteredAvailable.map((locale) => (
                <button
                  className="group flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-background"
                  disabled={isBusy}
                  key={locale.code}
                  onClick={() => onAdd(locale.code)}
                  type="button"
                >
                  <span className="text-xl leading-none">{locale.flag}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-medium text-[14px] text-foreground">
                      {locale.name}
                    </div>
                    <div className="font-sans text-[11px] text-muted-foreground">
                      {locale.code.toUpperCase()}
                    </div>
                  </div>
                  <Plus className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
