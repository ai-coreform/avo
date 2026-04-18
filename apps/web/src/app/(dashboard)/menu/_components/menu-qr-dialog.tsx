"use client";

import { Button } from "@avo/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@avo/ui/components/ui/dialog";
import { Download, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useRef } from "react";

interface MenuQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuId: string;
  menuName: string;
  menuSlug: string;
}

function buildQrUrl(menuId: string) {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";
  return `${origin}/qr/${menuId}`;
}

export function MenuQrDialog({
  open,
  onOpenChange,
  menuId,
  menuName,
  menuSlug,
}: MenuQrDialogProps) {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const qrUrl = buildQrUrl(menuId);

  const handleDownload = useCallback(() => {
    const svgElement = svgContainerRef.current?.querySelector("svg");
    if (!svgElement) {
      return;
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `qr-${menuSlug}.svg`;
    link.click();

    URL.revokeObjectURL(url);
  }, [menuSlug]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="size-4" />
            QR Code
          </DialogTitle>
          <DialogDescription>
            Scansiona per aprire <strong>{menuName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 overflow-hidden">
          <div
            className="w-full max-w-[200px] rounded-lg border bg-white p-3 [&>svg]:h-auto [&>svg]:w-full"
            ref={svgContainerRef}
          >
            <QRCodeSVG level="M" size={200} value={qrUrl} />
          </div>

          <p className="w-full truncate text-center font-mono text-[10px] text-muted-foreground">
            {qrUrl}
          </p>

          <Button
            className="w-full"
            onClick={handleDownload}
            size="sm"
            variant="outline"
          >
            <Download className="mr-2 size-3.5" />
            Scarica SVG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
