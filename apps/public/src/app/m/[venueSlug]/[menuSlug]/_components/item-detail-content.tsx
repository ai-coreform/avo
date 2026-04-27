"use client";

import { Button } from "@avo/ui/components/ui/button";
import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type {
  PublicMenuEntry,
  PublicMenuPromotion,
} from "@/api/public-menu/types";
import { useTranslation } from "../_hooks/use-translation-context";
import {
  ADDITIVE_MAP,
  ALLERGEN_MAP,
  FEATURE_MAP,
} from "../_utils/allergen-data";
import { formatPrice } from "../_utils/format-price";

type DetailItem =
  | { type: "entry"; data: PublicMenuEntry }
  | { type: "promotion"; data: PublicMenuPromotion };

interface ItemDetailContentProps {
  item: DetailItem;
  onClose?: () => void;
}

function EntryPriceDisplay({ entry }: { entry: PublicMenuEntry }) {
  if (entry.price != null) {
    return (
      <>
        <span
          className="font-bold font-display text-2xl"
          style={{ color: "var(--menu-price, var(--menu-primary))" }}
        >
          {formatPrice(entry.price)}
        </span>
        {entry.priceLabel && (
          <span
            className="font-sans text-xs tracking-wide"
            style={{ color: "var(--menu-text)", opacity: 0.5 }}
          >
            {entry.priceLabel}
          </span>
        )}
      </>
    );
  }

  if (entry.priceLabel) {
    return (
      <span
        className="font-sans text-sm tracking-wide"
        style={{ color: "var(--menu-text)", opacity: 0.5 }}
      >
        {entry.priceLabel}
      </span>
    );
  }

  return null;
}

function EntryDetails({ entry }: { entry: PublicMenuEntry }) {
  if (
    entry.allergens.length === 0 &&
    entry.features.length === 0 &&
    entry.additives.length === 0
  ) {
    return null;
  }

  return (
    <div className="space-y-3">
      {entry.allergens.length > 0 && (
        <div>
          <h3
            className="mb-2 font-bold font-display text-lg"
            style={{ color: "var(--menu-text)" }}
          >
            Allergeni
          </h3>
          <div className="flex flex-wrap gap-2">
            {entry.allergens.map((id) => {
              const a = ALLERGEN_MAP[id];
              if (!a) {
                return null;
              }
              return (
                <div
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                  key={id}
                  style={{ backgroundColor: "var(--menu-accent)" }}
                >
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs leading-none"
                    style={{
                      backgroundColor: "var(--menu-allergen, #B1693A)",
                      color: "var(--menu-allergen-icon, #FFFFFF)",
                    }}
                  >
                    {a.number}
                  </span>
                  <span
                    className="font-sans text-sm"
                    style={{ color: "var(--menu-text)" }}
                  >
                    {a.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {entry.features.length > 0 && (
        <div>
          <h3
            className="mb-2 font-bold font-display text-lg"
            style={{ color: "var(--menu-text)" }}
          >
            Caratteristiche
          </h3>
          <div className="flex flex-wrap gap-2">
            {entry.features.map((id) => {
              const f = FEATURE_MAP[id];
              if (!f) {
                return null;
              }
              return (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-sm"
                  key={id}
                  style={{
                    backgroundColor: "var(--menu-accent)",
                    color: "var(--menu-text)",
                  }}
                >
                  {f.label}
                </span>
              );
            })}
          </div>
        </div>
      )}
      {entry.additives.length > 0 && (
        <div>
          <h3
            className="mb-2 font-bold font-display text-lg"
            style={{ color: "var(--menu-text)" }}
          >
            Additivi
          </h3>
          <div className="flex flex-wrap gap-2">
            {entry.additives.map((id) => {
              const a = ADDITIVE_MAP[id];
              if (!a) {
                return null;
              }
              return (
                <span
                  className="rounded-full px-3 py-1 font-sans text-sm"
                  key={id}
                  style={{
                    backgroundColor: "var(--menu-accent)",
                    color: "var(--menu-text)",
                  }}
                >
                  {a.label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PromoComponents({
  components,
}: {
  components: PublicMenuPromotion["components"];
}) {
  if (components.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3
        className="font-bold font-display text-lg"
        style={{ color: "var(--menu-text)" }}
      >
        Include
      </h3>
      <div className="space-y-2">
        {components.map((comp, compIndex) => (
          <div
            className="flex items-center gap-3 rounded-lg p-2"
            key={comp.displayName ?? `comp-${compIndex}`}
            style={{ backgroundColor: "var(--menu-accent)" }}
          >
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--menu-primary)" }}
            />
            <span
              className="font-medium font-sans"
              style={{ color: "var(--menu-text)", opacity: 0.7 }}
            >
              {comp.displayName ?? "Elemento"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ItemDetailContent({ item, onClose }: ItemDetailContentProps) {
  const translate = useTranslation();
  const [imageError, setImageError] = useState(false);

  const _id = item.data.id;
  useEffect(() => {
    setImageError(false);
  }, []);

  const isPromo = item.type === "promotion";
  const promo = isPromo ? item.data : null;
  const entry = isPromo ? null : item.data;
  const title = isPromo
    ? (promo?.title ?? "")
    : translate(entry?.id ?? "", "title", entry?.title ?? "") || "";
  const imageUrl = isPromo ? promo?.imageUrl : entry?.imageUrl;

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-lg"
      style={{ backgroundColor: "var(--menu-bg)" }}
    >
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between border-b p-4"
        style={{ borderColor: "var(--menu-border)" }}
      >
        <Button
          className="h-6 w-6 p-0"
          onClick={onClose}
          size="icon"
          variant="ghost"
        >
          <X className="size-6" style={{ color: "var(--menu-text)" }} />
        </Button>
        <h1
          className="flex-1 text-center font-bold font-display text-xl uppercase"
          style={{ color: "var(--menu-text)" }}
        >
          {title}
        </h1>
        <div className="h-6 w-6" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Image */}
        {imageUrl && (
          <div
            className="relative flex h-64 w-full items-center justify-center overflow-hidden md:h-80"
            style={{
              background:
                "linear-gradient(to bottom right, var(--menu-primary-light), var(--menu-accent))",
            }}
          >
            {isPromo && promo?.badgeLabel && (
              <div className="absolute top-4 right-4 z-10">
                <span
                  className="rounded-full px-3 py-2 font-bold font-sans text-sm text-white shadow-lg"
                  style={{ backgroundColor: "var(--menu-primary)" }}
                >
                  {promo?.badgeLabel}
                </span>
              </div>
            )}
            {!imageError && (
              <Image
                alt={title}
                className="object-cover"
                fill
                onError={() => setImageError(true)}
                sizes="(max-width: 768px) 100vw, 80vw"
                src={imageUrl}
              />
            )}
            {imageError && (
              <span
                className="font-bold font-display text-6xl"
                style={{ color: "var(--menu-primary)" }}
              >
                {title.charAt(0)}
              </span>
            )}
          </div>
        )}

        {/* Details */}
        <div className="space-y-6 p-6">
          {/* Title and Price */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2
                className="font-bold font-display text-2xl uppercase"
                style={{ color: "var(--menu-text)" }}
              >
                {title}
              </h2>
              {isPromo && promo?.shortDescription && (
                <p
                  className="mt-1 font-sans"
                  style={{ color: "var(--menu-text)", opacity: 0.6 }}
                >
                  {promo?.shortDescription}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              {isPromo && promo?.originalPrice != null && (
                <span
                  className="font-sans text-lg line-through"
                  style={{ color: "var(--menu-text)", opacity: 0.5 }}
                >
                  {formatPrice(promo?.originalPrice)}
                </span>
              )}
              {isPromo ? (
                <span
                  className="font-bold font-display text-3xl"
                  style={{
                    color: "var(--menu-price, var(--menu-primary))",
                  }}
                >
                  {formatPrice(promo?.promoPrice)}
                </span>
              ) : null}
              {!isPromo && entry && <EntryPriceDisplay entry={entry} />}
            </div>
          </div>

          {/* Promo components */}
          {isPromo && promo && (
            <PromoComponents components={promo.components} />
          )}

          {/* Allergens, Features, Additives for entries */}
          {entry && <EntryDetails entry={entry} />}

          {/* Long description (promos) */}
          {isPromo && promo?.longDescription && (
            <div className="space-y-1">
              <h3
                className="font-bold font-display text-lg"
                style={{ color: "var(--menu-text)" }}
              >
                Descrizione
              </h3>
              <div
                className="font-sans text-base leading-relaxed"
                style={{ color: "var(--menu-text)", opacity: 0.6 }}
              >
                <p>{promo?.longDescription}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
