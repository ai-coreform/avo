"use client";

import { Button } from "@avo/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@avo/ui/components/ui/dialog";
import { Input } from "@avo/ui/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@avo/ui/components/ui/tabs";
import { Copy, Download } from "lucide-react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config/environment";

type LogoMode = "none" | "avo" | "venue";

interface VenueQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueSlug: string;
  venueLogo?: string | null;
}

function buildQrUrl(venueSlug: string) {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";
  return `${origin}/qr/v/${venueSlug}`;
}

function resolveLogoUrl(logo: string | null | undefined): string | null {
  if (!logo) {
    return null;
  }
  if (logo.startsWith("http")) {
    return logo;
  }
  return `${API_BASE_URL}${logo}`;
}

const HASH_PREFIX_RE = /^#+/;
const HEX_COLOR_RE = /^#[0-9a-fA-F]{0,6}$/;

function ColorPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.trim();
    v = `#${v.replace(HASH_PREFIX_RE, "").slice(0, 6)}`;
    if (HEX_COLOR_RE.test(v)) {
      onChange(v);
    }
  }

  return (
    <div className="space-y-1">
      <span className="font-medium text-xs">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          className="h-7 w-7 shrink-0 cursor-pointer rounded-md border bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-0"
          onChange={(e) => onChange(e.target.value)}
          type="color"
          value={value}
        />
        <Input
          className="h-7 w-20 font-mono text-[11px] uppercase"
          maxLength={7}
          onChange={handleTextChange}
          value={value}
        />
      </div>
    </div>
  );
}

function AvoIcon({
  bodyColor,
  detailColor,
  className,
}: {
  bodyColor: string;
  detailColor: string;
  className?: string;
}) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 34 40"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="avo-body-grad"
          x1="9.00966"
          x2="22.9524"
          y1="-0.017938"
          y2="38.7214"
        >
          <stop stopColor={bodyColor} />
          <stop offset="0.717" stopColor={bodyColor} />
          <stop offset="1" stopColor={bodyColor} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <path
        d="M2.469 8.49037C3.44831 5.46493 5.01274 2.79122 7.98783 1.30213C10.6472 -0.0289716 13.3552 -0.398058 16.2419 0.46784C19.7455 1.51883 22.2632 4.49379 24.5497 7.13527C25.012 7.66929 26.0654 8.90148 26.4203 9.44586L26.4493 9.48959C26.4549 9.49845 26.4605 9.50726 26.4661 9.51612C26.8414 9.83562 27.5982 11.0217 27.9485 11.4601C33.3721 18.2454 35.9247 27.1524 29.6815 34.3335C28.2534 35.9761 25.6271 37.8544 23.474 38.5742C19.1362 40.2996 13.6642 40.5706 9.31058 38.769C9.19683 38.7218 9.08387 38.6726 8.97182 38.6218C6.0579 37.3306 3.54923 35.2414 2.05643 32.4485C1.03716 30.546 0.386422 28.4761 0.13695 26.3429C-0.459087 21.5585 0.995669 13.0536 2.469 8.49037Z"
        fill="url(#avo-body-grad)"
      />
      <path
        d="M19.1982 15.5147C19.2424 15.3988 19.412 15.4007 19.4534 15.5175L19.5693 15.8437C19.7424 16.3309 20.0256 16.7745 20.3983 17.1418C20.7709 17.5092 21.2236 17.791 21.7231 17.9666L22.0968 18.098C22.2157 18.1398 22.2159 18.3029 22.0971 18.345L21.7226 18.478C21.2367 18.6505 20.7953 18.9237 20.4293 19.2784C20.0632 19.6331 19.7812 20.061 19.6029 20.5322L19.4563 20.9196C19.4129 21.0342 19.2459 21.0345 19.2021 20.92L19.049 20.5201C18.8699 20.0524 18.5886 19.6278 18.2243 19.2755C17.86 18.9233 17.4213 18.6518 16.9385 18.4796L16.5572 18.3437C16.4391 18.3016 16.4388 18.1396 16.5567 18.0971L16.9455 17.9569C17.4263 17.7835 17.8628 17.5114 18.2251 17.1592C18.5875 16.8071 18.8672 16.3832 19.0451 15.9165L19.1982 15.5147Z"
        fill={detailColor}
      />
      <path
        d="M21.3397 24.2621C21.3389 23.5519 21.9145 22.9782 22.6289 22.9798C23.3458 22.9815 23.9307 23.5618 23.936 24.2753L22.6388 24.2727L23.9363 24.2769L23.9367 24.2785L23.9359 24.282C23.9359 24.2844 23.9362 24.2874 23.9362 24.2903C23.9362 24.2963 23.9364 24.3039 23.9363 24.312C23.9361 24.3279 23.9363 24.3485 23.9356 24.3722C23.9341 24.42 23.9307 24.4832 23.925 24.5599C23.9137 24.7135 23.8911 24.9231 23.8468 25.1734C23.7586 25.6718 23.5813 26.349 23.219 27.0699C22.4734 28.5536 20.9875 30.1314 18.1945 30.7653C15.402 31.3989 13.357 30.6224 12.0179 29.612C11.3672 29.1209 10.9023 28.5895 10.5981 28.1802C10.4453 27.9745 10.3305 27.7962 10.2509 27.6632C10.2113 27.5968 10.1796 27.5415 10.1567 27.4993C10.1454 27.4784 10.1363 27.4598 10.1289 27.4455C10.1252 27.4384 10.1204 27.4317 10.1176 27.4264C10.1164 27.4239 10.1152 27.4209 10.1142 27.4188L10.113 27.4141C10.1205 27.4097 10.2113 27.3653 11.2757 26.8515L10.1111 27.4129C9.79382 26.7702 10.0582 25.9971 10.7008 25.6869C11.3435 25.3771 12.1227 25.6475 12.4404 26.2901C12.4472 26.3026 12.4593 26.3255 12.4779 26.3567C12.518 26.4237 12.5849 26.5287 12.6797 26.6563C12.8709 26.9135 13.1659 27.2492 13.5732 27.5567C14.3506 28.1434 15.6158 28.6935 17.5947 28.2445C19.5739 27.7954 20.4607 26.7568 20.8936 25.8954C21.1204 25.444 21.2335 25.0158 21.2889 24.7025C21.3164 24.5472 21.329 24.4241 21.3348 24.3466C21.3376 24.3081 21.3388 24.2806 21.3393 24.2672C21.3393 24.2649 21.3393 24.2627 21.3393 24.2605L21.3397 24.2621Z"
        fill={detailColor}
      />
    </svg>
  );
}

export function VenueQrDialog({
  open,
  onOpenChange,
  venueSlug,
  venueLogo,
}: VenueQrDialogProps) {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const qrUrl = buildQrUrl(venueSlug);
  const resolvedVenueLogo = resolveLogoUrl(venueLogo);
  const hasVenueLogo = Boolean(resolvedVenueLogo);

  const [logoMode, setLogoMode] = useState<LogoMode>("avo");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [avoLogoBg, setAvoLogoBg] = useState("#29402A");

  const showLogo = logoMode !== "none";

  const handleDownloadSvg = useCallback(() => {
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
    link.download = `qr-${venueSlug}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }, [venueSlug]);

  const handleDownloadPng = useCallback(() => {
    const canvas = canvasContainerRef.current?.querySelector("canvas");
    if (!canvas) {
      return;
    }
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `qr-${venueSlug}.png`;
    link.click();
  }, [venueSlug]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(qrUrl);
    toast.success("Link copiato negli appunti");
  }, [qrUrl]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle>Il tuo QR Code</DialogTitle>
          <DialogDescription>Stampa e posiziona sui tavoli.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {/* Logo mode tabs */}
          <Tabs
            onValueChange={(v) => setLogoMode(v as LogoMode)}
            value={logoMode}
          >
            <TabsList className="w-full">
              <TabsTrigger value="none">Nessuno</TabsTrigger>
              <TabsTrigger value="avo">Logo Avo</TabsTrigger>
              <TabsTrigger disabled={!hasVenueLogo} value="venue">
                Il tuo logo
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Color pickers */}
          <div className="flex items-center justify-center gap-3">
            <ColorPicker label="Colore QR" onChange={setFgColor} value={fgColor} />
            <ColorPicker label="Sfondo" onChange={setBgColor} value={bgColor} />
            {logoMode === "avo" && (
              <ColorPicker
                label="Logo"
                onChange={setAvoLogoBg}
                value={avoLogoBg}
              />
            )}
          </div>

          {/* QR code with circular logo overlay */}
          <div className="relative rounded-xl border bg-white p-5">
            <div ref={svgContainerRef}>
              <QRCodeSVG
                bgColor={bgColor}
                fgColor={fgColor}
                level="H"
                size={220}
                value={qrUrl}
              />
            </div>

            {/* Circular logo overlay */}
            {showLogo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="flex size-[72px] items-center justify-center overflow-hidden rounded-full border-[3px] shadow-md"
                  style={{ backgroundColor: bgColor, borderColor: bgColor }}
                >
                  {logoMode === "avo" && (
                    <div
                      className="flex size-full items-center justify-center rounded-full"
                      style={{ backgroundColor: avoLogoBg }}
                    >
                      <AvoIcon
                        bodyColor="#ffffff"
                        className="size-10"
                        detailColor={avoLogoBg}
                      />
                    </div>
                  )}
                  {logoMode === "venue" && resolvedVenueLogo && (
                    // biome-ignore lint/performance/noImgElement: dynamic venue logo URL
                    // biome-ignore lint/correctness/useImageSize: sized by CSS
                    <img
                      alt="Logo"
                      className="size-full rounded-full object-contain p-1"
                      src={resolvedVenueLogo}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Hidden canvas for PNG export */}
          <div className="hidden" ref={canvasContainerRef}>
            <QRCodeCanvas
              bgColor={bgColor}
              fgColor={fgColor}
              level="H"
              size={512}
              value={qrUrl}
            />
          </div>

          {/* Download buttons */}
          <div className="grid w-full grid-cols-2 gap-2">
            <Button onClick={handleDownloadSvg} size="sm" variant="outline">
              <Download className="size-3.5" />
              SVG
            </Button>
            <Button onClick={handleDownloadPng} size="sm" variant="outline">
              <Download className="size-3.5" />
              PNG
            </Button>
          </div>

          {/* URL */}
          <p className="w-full truncate rounded-lg border px-3 py-2 text-center font-mono text-[11px] text-muted-foreground">
            {qrUrl}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
