"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { checkSlug } from "./index";

type SlugStatus = "idle" | "checking" | "available" | "taken";

interface UseCheckSlugResult {
  status: SlugStatus;
  normalizedSlug: string;
}

const DEBOUNCE_MS = 400;

export function useCheckSlug(slug: string): UseCheckSlugResult {
  const [status, setStatus] = useState<SlugStatus>("idle");
  const [normalizedSlug, setNormalizedSlug] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const check = useCallback(async (value: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("checking");

    try {
      const result = await checkSlug(value);

      if (controller.signal.aborted) {
        return;
      }

      setNormalizedSlug(result.slug);
      setStatus(result.available ? "available" : "taken");
    } catch {
      if (!controller.signal.aborted) {
        setStatus("idle");
      }
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const trimmed = slug.trim();
    if (!trimmed) {
      setStatus("idle");
      setNormalizedSlug("");
      return;
    }

    timerRef.current = setTimeout(() => check(trimmed), DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [slug, check]);

  return { status, normalizedSlug };
}
