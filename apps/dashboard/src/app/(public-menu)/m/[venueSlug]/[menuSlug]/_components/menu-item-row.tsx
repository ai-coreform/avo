"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import type { PublicMenuEntry } from "@/api/public-menu/types";
import { useTranslation } from "../_hooks/use-translation-context";
import { formatPrice } from "../_utils/format-price";
import { AllergenBadges } from "./allergen-badges";
import { ImageLightbox } from "./image-lightbox";
import { ItemDetailSheet } from "./item-detail-sheet";

interface MenuItemRowProps {
  entry: PublicMenuEntry;
}

export function MenuItemRow({ entry }: MenuItemRowProps) {
  const t = useTranslation();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const title = t(entry.id, "title", entry.title);
  const description =
    t(entry.id, "description", entry.description ?? "") || null;

  const hasPrice = entry.price != null || !!entry.priceLabel;

  const priceContent = hasPrice ? (
    <span
      className="whitespace-nowrap font-display font-semibold text-base"
      style={{ color: "var(--menu-price, var(--menu-primary))" }}
    >
      {entry.price != null ? formatPrice(entry.price) : null}
      {entry.priceLabel && (
        <span
          className="ml-1 font-normal font-sans text-xs"
          style={{ color: "var(--menu-text)", opacity: 0.5 }}
        >
          {entry.priceLabel}
        </span>
      )}
    </span>
  ) : null;

  return (
    <div className="relative -mx-2 px-2">
      {/* Overlay button covers the entire row for sheet trigger */}
      <button
        aria-label={title}
        className="absolute inset-0 z-0 cursor-pointer"
        onClick={() => setSheetOpen(true)}
        type="button"
      />

      <div
        className={`relative w-full text-left ${entry.imageUrl ? "flex items-start gap-3 pt-5" : "pt-5"}`}
      >
        {entry.imageUrl && (
          <button
            aria-label={`Visualizza immagine di ${title}`}
            className="relative z-10 h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-md bg-black/5 sm:h-16 sm:w-16"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(true);
            }}
            type="button"
          >
            <Image
              alt={title}
              className="object-cover"
              fill
              sizes="(max-width: 640px) 56px, 64px"
              src={entry.imageUrl}
              unoptimized
            />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div
            className="pb-0"
            style={
              hasPrice
                ? {
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    alignItems: "baseline",
                  }
                : undefined
            }
          >
            {hasPrice ? (
              <>
                <span
                  className="min-w-0 font-display font-semibold text-base uppercase"
                  style={{ color: "var(--menu-text)" }}
                >
                  {title}
                </span>
                <span className="dotted-leader" />
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  {priceContent}
                  <span className="inline-block w-4" />
                </div>
              </>
            ) : (
              <span
                className="font-display font-semibold text-base uppercase"
                style={{ color: "var(--menu-text)" }}
              >
                {title}
              </span>
            )}
          </div>

          {description && (
            <p
              className="pb-0 font-sans text-sm leading-relaxed"
              style={{ color: "var(--menu-text)", opacity: 0.6 }}
            >
              {description}
            </p>
          )}

          {(entry.allergens.length > 0 ||
            entry.features.length > 0 ||
            entry.additives.length > 0) && (
            <div className="relative z-10">
              <AllergenBadges
                additives={entry.additives}
                allergens={entry.allergens}
                features={entry.features}
              />
            </div>
          )}
        </div>
      </div>

      <ItemDetailSheet
        item={{ type: "entry", data: entry }}
        onOpenChange={setSheetOpen}
        open={sheetOpen}
      />

      {lightboxOpen && entry.imageUrl && (
        <ImageLightbox
          alt={title}
          onClose={closeLightbox}
          src={entry.imageUrl}
        />
      )}
    </div>
  );
}
