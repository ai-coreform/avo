"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@avo/ui/components/ui/resizable";
import { X } from "lucide-react";
import { MenuPreviewIframe } from "./menu-preview-iframe";

interface MenuPreviewPanelProps {
  /** The left-side content (editor/settings) */
  children: React.ReactNode;
  venueSlug: string;
  menuSlug: string;
  showPreview: boolean;
  onClosePreview: () => void;
}

export function MenuPreviewPanel({
  children,
  venueSlug,
  menuSlug,
  showPreview,
  onClosePreview,
}: MenuPreviewPanelProps) {
  if (!showPreview) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden border-t">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize={60} minSize={30}>
          <div className="h-full overflow-y-auto">{children}</div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={30} minSize={20}>
          <div className="flex h-full flex-col overflow-hidden bg-muted/30">
            <div className="flex shrink-0 items-center justify-between border-b bg-card px-4 py-2.5">
              <span className="flex items-center gap-2 font-medium text-muted-foreground text-sm">
                <span className="size-2 rounded-full bg-green-500" />
                Anteprima
              </span>
              <button
                className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={onClosePreview}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Phone frame */}
            <div className="flex min-h-0 flex-1 items-center justify-center p-4">
              <div className="h-full max-h-[640px] w-full max-w-[320px] overflow-hidden rounded-[2rem] border-[3px] border-neutral-800 bg-white shadow-lg dark:border-neutral-600">
                <MenuPreviewIframe
                  className="size-full border-0"
                  menuSlug={menuSlug}
                  venueSlug={venueSlug}
                />
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
