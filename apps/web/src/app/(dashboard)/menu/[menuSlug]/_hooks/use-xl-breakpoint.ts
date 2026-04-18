"use client";

import { useSyncExternalStore } from "react";

const XL_BREAKPOINT = 1280;

const xlSubscribe = (cb: () => void) => {
  const mql = window.matchMedia(`(min-width: ${XL_BREAKPOINT}px)`);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};

const xlSnapshot = () => window.innerWidth >= XL_BREAKPOINT;
const xlServerSnapshot = () => false;

export function useXlBreakpoint() {
  return useSyncExternalStore(xlSubscribe, xlSnapshot, xlServerSnapshot);
}
