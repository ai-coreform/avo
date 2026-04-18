"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useHeaderHeight() {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const updateHeight = useCallback(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) {
      return;
    }

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);

    return () => observer.disconnect();
  }, [updateHeight]);

  return { headerRef, headerHeight };
}
