"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  handleUnauthorizedError,
  isUnauthorizedError,
  parseError,
  showErrorToast,
} from "@/lib/api-error";

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error) => {
        showErrorToast(error);

        if (isUnauthorizedError(error)) {
          handleUnauthorizedError();
        }
      },
    },
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (isUnauthorizedError(error)) {
          return false;
        }

        // Don't retry on client errors (4xx)
        const parsed = parseError(error);
        if (parsed.status && parsed.status >= 400 && parsed.status < 500) {
          return false;
        }

        // Retry up to 2 times for server errors
        return failureCount < 2;
      },
      throwOnError: (error) => {
        if (isUnauthorizedError(error)) {
          handleUnauthorizedError();
          return true;
        }

        return false;
      },
    },
  },
});

export function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
