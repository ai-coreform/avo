"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@avo/ui/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@avo/ui/components/ui/sheet";
import type {
  PublicMenuEntry,
  PublicMenuPromotion,
} from "@/api/public-menu/types";
import { useTranslation } from "../_hooks/use-translation-context";
import { ItemDetailContent } from "./item-detail-content";

type DetailItem =
  | { type: "entry"; data: PublicMenuEntry }
  | { type: "promotion"; data: PublicMenuPromotion };

interface ItemDetailSheetProps {
  item: DetailItem;
  children?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ItemDetailSheet({
  item,
  open,
  onOpenChange,
}: ItemDetailSheetProps) {
  const t = useTranslation();

  const title =
    item.type === "promotion"
      ? item.data.title
      : t(item.data.id, "title", item.data.title);

  return (
    <>
      {/* Mobile: Sheet */}
      <div className="md:hidden">
        <Sheet onOpenChange={onOpenChange} open={open}>
          <SheetContent
            className="h-full overflow-hidden p-0"
            showCloseButton={false}
            side="bottom"
          >
            <SheetTitle className="sr-only">{title}</SheetTitle>
            <ItemDetailContent
              item={item}
              onClose={() => onOpenChange(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Dialog */}
      <div className="hidden md:block">
        <Dialog onOpenChange={onOpenChange} open={open}>
          <DialogContent
            className="h-[80vh] max-w-2xl gap-0 overflow-hidden p-0"
            showCloseButton={false}
          >
            <DialogTitle className="sr-only">{title}</DialogTitle>
            <ItemDetailContent
              item={item}
              onClose={() => onOpenChange(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
