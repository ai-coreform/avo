"use client";

import { Badge } from "@avo/ui/components/ui/badge";
import Image from "next/image";
import { useState } from "react";
import type { PublicMenuPromotion } from "@/api/public-menu/types";
import { formatPrice } from "../_utils/format-price";
import { ItemDetailSheet } from "./item-detail-sheet";

interface PromotionCardProps {
  promotion: PublicMenuPromotion;
}

export function PromotionCard({ promotion }: PromotionCardProps) {
  const [imageError, setImageError] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <button
        className="relative flex h-full cursor-pointer flex-col rounded-lg border p-4 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
        onClick={() => setSheetOpen(true)}
        style={{
          backgroundColor: "var(--menu-card-bg, var(--menu-primary-light))",
          borderColor: "var(--menu-border, var(--menu-accent))",
        }}
        type="button"
      >
        {promotion.badgeLabel && (
          <div className="absolute top-3 right-3 z-10">
            <Badge
              className="font-bold font-sans text-white text-xs shadow-lg"
              style={{ backgroundColor: "var(--menu-primary)" }}
            >
              {promotion.badgeLabel}
            </Badge>
          </div>
        )}

        <div className="mb-3 w-full">
          <div
            className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg"
            style={{
              background:
                "linear-gradient(135deg, var(--menu-primary), color-mix(in srgb, var(--menu-primary) 70%, white))",
            }}
          >
            {!imageError && promotion.imageUrl && (
              <Image
                alt={promotion.title}
                className="object-cover"
                fill
                onError={() => setImageError(true)}
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 250px, 350px"
                src={promotion.imageUrl}
              />
            )}
            {(imageError || !promotion.imageUrl) && (
              <span className="font-bold font-display text-3xl text-white">
                {promotion.title.charAt(0)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <h3
            className="mb-2 font-bold font-display text-lg uppercase"
            style={{ color: "var(--menu-text)" }}
          >
            {promotion.title}
          </h3>

          <p
            className="mb-3 flex-1 font-sans text-sm"
            style={{ color: "var(--menu-text)", opacity: 0.7 }}
          >
            {promotion.shortDescription}
          </p>

          <div className="flex flex-col">
            {promotion.originalPrice != null && (
              <span
                className="font-sans text-sm line-through"
                style={{ color: "var(--menu-text)", opacity: 0.5 }}
              >
                {formatPrice(promotion.originalPrice)}
              </span>
            )}
            <span
              className="font-bold font-display text-2xl"
              style={{
                color: "var(--menu-price, var(--menu-primary))",
              }}
            >
              {formatPrice(promotion.promoPrice)}
            </span>
          </div>
        </div>
      </button>
      <ItemDetailSheet
        item={{ type: "promotion", data: promotion }}
        onOpenChange={setSheetOpen}
        open={sheetOpen}
      />
    </>
  );
}
