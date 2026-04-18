"use client";

import { useMutation } from "@tanstack/react-query";
import { startImport } from "./index";

export function useStartImport() {
  return useMutation({
    mutationFn: startImport,
  });
}
