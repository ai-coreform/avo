"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@avo/ui/components/ui/alert-dialog";
import { Button } from "@avo/ui/components/ui/button";
import { DataTableActionBar } from "@avo/ui/components/ui/data-table/data-table-action-bar";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@avo/ui/components/ui/popover";
import { Separator } from "@avo/ui/components/ui/separator";
import { Eye, Trash2, X } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface MenuEntrySelectionActionBarProps {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  onSetVisibility: (nextVisible: boolean) => void;
}

function VisibilityOption({
  active,
  children,
  onClick,
  tone = "default",
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
  tone?: "default" | "success";
}) {
  return (
    <button
      className={cn(
        "flex h-8 items-center gap-2 rounded-full px-3 text-left text-xs transition-colors",
        tone === "success"
          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "bg-muted/60 text-foreground hover:bg-muted",
        active && "ring-1 ring-foreground/10"
      )}
      onClick={onClick}
      type="button"
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          tone === "success" ? "bg-emerald-500" : "bg-muted-foreground"
        )}
      />
      <span className="font-medium">{children}</span>
    </button>
  );
}

export function MenuEntrySelectionActionBar({
  count,
  onClear,
  onDelete,
  onSetVisibility,
}: MenuEntrySelectionActionBarProps) {
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const selectionLabel = useMemo(
    () => `${count} ${count === 1 ? "selezionato" : "selezionati"}`,
    [count]
  );
  const deleteLabel = useMemo(
    () => `Elimina ${count} ${count === 1 ? "voce" : "voci"}`,
    [count]
  );

  if (count === 0) {
    return null;
  }

  return (
    <>
      <AlertDialog
        onOpenChange={setIsDeleteDialogOpen}
        open={isDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare {count}{" "}
              {count === 1 ? "voce" : "voci"}? Questa azione non puo essere
              annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete();
                setIsDeleteDialogOpen(false);
              }}
              variant="destructive"
            >
              {deleteLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DataTableActionBar
        className="z-[70] border-[#07160d] bg-[#07160d] text-white shadow-[0_18px_45px_rgba(3,12,7,0.28)]"
        label={
          <div className="flex items-center gap-2">
            <div className="flex size-5 items-center justify-center rounded-full bg-white/12 font-semibold text-[11px] text-white">
              {count}
            </div>
            <span className="whitespace-nowrap text-white/85 text-xs">
              {selectionLabel.replace(`${count} `, "")}
            </span>
          </div>
        }
        labelClassName="border-white/12 bg-white/4 text-white"
        separatorClassName="bg-white/12"
        visible
      >
        <Popover onOpenChange={setIsVisibilityOpen} open={isVisibilityOpen}>
          <PopoverTrigger asChild>
            <Button
              className="text-white hover:bg-white/8 hover:text-white aria-expanded:bg-white aria-expanded:text-[#07160d]"
              type="button"
              variant="ghost"
            >
              <Eye className="size-4" />
              Visibilita
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="center"
            className="w-52 rounded-xl p-3"
            sideOffset={8}
          >
            <PopoverHeader className="gap-0">
              <PopoverTitle className="font-medium text-foreground/70 text-xs">
                Mostra/Nascondi
              </PopoverTitle>
            </PopoverHeader>
            <div className="mt-2 grid gap-1.5">
              <VisibilityOption
                active
                onClick={() => {
                  onSetVisibility(true);
                  setIsVisibilityOpen(false);
                }}
                tone="success"
              >
                Visibile
              </VisibilityOption>
              <VisibilityOption
                onClick={() => {
                  onSetVisibility(false);
                  setIsVisibilityOpen(false);
                }}
              >
                Nascosta
              </VisibilityOption>
            </div>
          </PopoverContent>
        </Popover>

        <Separator className="bg-white/12" orientation="vertical" />

        <Button
          className="text-[#ff6b6b] hover:bg-white/8 hover:text-[#ff7b7b]"
          onClick={() => setIsDeleteDialogOpen(true)}
          type="button"
          variant="ghost"
        >
          <Trash2 className="size-4" />
          Elimina
        </Button>

        <Separator className="bg-white/12" orientation="vertical" />

        <Button
          className="text-white/55 hover:bg-white/8 hover:text-white"
          onClick={onClear}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </DataTableActionBar>
    </>
  );
}
