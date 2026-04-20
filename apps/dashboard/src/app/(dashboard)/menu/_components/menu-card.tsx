"use client";

import { Badge } from "@avo/ui/components/ui/badge";
import { Button } from "@avo/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@avo/ui/components/ui/dropdown-menu";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import {
  ArrowUpRight,
  Clock3,
  EllipsisVertical,
  Globe,
  PencilLine,
  QrCode,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { getMenuStatusClassName, getMenuStatusLabel } from "@/api/menu/data";
import type { MenuListItem } from "@/api/menu/types";
import { DeleteMenuDialog } from "./delete-menu-dialog";
import { MenuQrDialog } from "./menu-qr-dialog";
import { MenuUpsertDialog } from "./menu-upsert-dialog";

interface MenuCardProps {
  menu: MenuListItem;
  venueSlug: string | null;
}

function buildQrUrl(menuId: string) {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";
  return `${origin}/qr/${menuId}`;
}

function formatMenuDate(value: string) {
  return format(parseISO(value), "d MMM yyyy", { locale: it });
}

export function MenuCard({ menu, venueSlug }: MenuCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  return (
    <>
      <Link
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-black/5 hover:shadow-lg"
        href={`/menu/${menu.slug}`}
      >
        {/* QR area — primary-colored with decorative elements */}
        <div className="relative flex h-28 items-center justify-center overflow-hidden bg-primary">
          {/* Decorative circles */}
          <div className="absolute -top-6 -left-6 size-24 rounded-full bg-white/[0.04]" />
          <div className="absolute -right-4 -bottom-8 size-32 rounded-full bg-white/[0.04]" />
          <div className="absolute top-3 right-12 size-10 rounded-full bg-white/[0.06]" />

          {/* QR code */}
          <div className="relative rounded-lg bg-white p-1.5 shadow-black/15 shadow-md">
            <QRCodeSVG
              bgColor="transparent"
              fgColor="var(--primary)"
              level="M"
              size={64}
              value={buildQrUrl(menu.id)}
            />
          </div>

          {/* Hover arrow */}
          <div className="absolute top-3 right-3 translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
            <ArrowUpRight className="size-4 text-primary-foreground/70" />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-2 px-4 py-3">
          {/* Title + actions */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-sm leading-tight">
                {menu.name}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  className={getMenuStatusClassName(menu.status)}
                  variant="secondary"
                >
                  {getMenuStatusLabel(menu.status)}
                </Badge>
              </div>
            </div>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                  onClick={(e) => e.preventDefault()}
                  size="icon"
                  variant="ghost"
                >
                  <EllipsisVertical className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => e.preventDefault()}
              >
                <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                  <PencilLine className="mr-2 size-4" />
                  Modifica
                </DropdownMenuItem>
                {menu.status === "published" && venueSlug && (
                  <DropdownMenuItem asChild>
                    <a
                      href={`/m/${venueSlug}/${menu.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <Globe className="mr-2 size-4" />
                      Vedi menu pubblico
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => setQrOpen(true)}>
                  <QrCode className="mr-2 size-4" />
                  QR Code
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Elimina
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Meta */}
          <div className="mt-auto flex items-center gap-1.5 text-muted-foreground text-xs">
            <Clock3 className="size-3" />
            <span>Aggiornato {formatMenuDate(menu.updatedAt)}</span>
          </div>
        </div>
      </Link>

      <MenuUpsertDialog
        menu={menu}
        onOpenChange={setEditOpen}
        open={editOpen}
      />
      <DeleteMenuDialog
        menu={menu}
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
      />
      <MenuQrDialog
        menuId={menu.id}
        menuName={menu.name}
        menuSlug={menu.slug}
        onOpenChange={setQrOpen}
        open={qrOpen}
      />
    </>
  );
}
