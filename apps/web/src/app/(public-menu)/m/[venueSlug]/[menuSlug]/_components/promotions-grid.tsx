"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicMenuPromotion } from "@/api/public-menu/types";
import { isPromotionVisible } from "../_utils/promo-schedule-filter";
import { PromotionCard } from "./promotion-card";

interface PromotionsGridProps {
  promotions: PublicMenuPromotion[];
}

function useVisiblePromotions(promotions: PublicMenuPromotion[]) {
  const filter = useCallback(
    () => promotions.filter((p) => isPromotionVisible(p)),
    [promotions]
  );
  const [visible, setVisible] = useState(filter);

  useEffect(() => {
    setVisible(filter());
    const interval = setInterval(() => setVisible(filter()), 60_000);
    return () => clearInterval(interval);
  }, [filter]);

  return visible;
}

export function PromotionsGrid({ promotions }: PromotionsGridProps) {
  const visible = useVisiblePromotions(promotions);

  if (visible.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div
          className="rounded-lg border p-8 text-center"
          style={{
            backgroundColor: "var(--menu-card-bg)",
            borderColor: "var(--menu-border)",
          }}
        >
          <p
            className="font-bold font-display text-lg"
            style={{ color: "var(--menu-text)" }}
          >
            Nessuna promozione attiva
          </p>
          <p
            className="mt-1 font-sans text-sm"
            style={{ color: "var(--menu-text)", opacity: 0.5 }}
          >
            Le promozioni appariranno qui quando disponibili
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {visible.map((promo) => (
        <PromotionCard key={promo.id} promotion={promo} />
      ))}
    </div>
  );
}

export function PromotionsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => `promo-skeleton-${i}`).map((key) => (
        <div
          className="flex flex-col rounded-lg border p-4"
          key={key}
          style={{
            backgroundColor: "var(--menu-card-bg)",
            borderColor: "var(--menu-border)",
          }}
        >
          <div className="mb-3 aspect-[4/3] w-full animate-pulse rounded-lg bg-current/10" />
          <div className="mb-2 h-5 w-2/3 animate-pulse rounded bg-current/10" />
          <div className="mb-1 h-4 w-full animate-pulse rounded bg-current/10" />
          <div className="mb-3 h-4 w-1/2 animate-pulse rounded bg-current/10" />
          <div className="h-7 w-20 animate-pulse rounded bg-current/10" />
        </div>
      ))}
    </div>
  );
}
