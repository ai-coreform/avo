"use client";

import { createContext, type ReactNode, useContext } from "react";

type TranslateFn = (
  entityId: string,
  field: string,
  fallback: string
) => string;

const noopTranslate: TranslateFn = (_id, _field, fallback) => fallback;

const TranslationContext = createContext<TranslateFn>(noopTranslate);

export function TranslationProvider({
  children,
  t,
}: {
  children: ReactNode;
  t: TranslateFn;
}) {
  return (
    <TranslationContext.Provider value={t}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  return useContext(TranslationContext);
}
