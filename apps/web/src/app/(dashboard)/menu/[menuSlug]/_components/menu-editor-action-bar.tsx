"use client";

import { Button } from "@avo/ui/components/ui/button";
import { DataTableActionBar } from "@avo/ui/components/ui/data-table/data-table-action-bar";
import { Separator } from "@avo/ui/components/ui/separator";
import { Save, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHasPendingEdits } from "./pending-edits-context";

interface MenuEditorActionBarProps {
  visible: boolean;
  isSaving: boolean;
  onDiscard: () => void;
  onSave: () => void;
  className?: string;
}

export function MenuEditorActionBar({
  visible,
  isSaving,
  onDiscard,
  onSave,
  className,
}: MenuEditorActionBarProps) {
  const hasPendingEdits = useHasPendingEdits();

  return (
    <DataTableActionBar
      className={cn(
        "z-[70] border-[#07160d] bg-[#07160d] text-white shadow-[0_18px_45px_rgba(3,12,7,0.28)]",
        className
      )}
      label="Modifiche non salvate"
      labelClassName="border-white/12 bg-white/4 text-white"
      separatorClassName="bg-white/12"
      visible={visible || hasPendingEdits}
    >
      <Button
        className="text-white/55 hover:bg-white/8 hover:text-white"
        disabled={isSaving}
        onClick={onDiscard}
        type="button"
        variant="ghost"
      >
        <Undo2 className="size-4" />
        Scarta
      </Button>

      <Separator className="bg-white/12" orientation="vertical" />

      <Button
        className="bg-white text-[#07160d] hover:bg-white/90 hover:text-[#07160d]"
        disabled={isSaving}
        onClick={onSave}
        type="button"
      >
        <Save className="size-4" />
        {isSaving ? "Salvataggio..." : "Salva modifiche"}
      </Button>
    </DataTableActionBar>
  );
}
