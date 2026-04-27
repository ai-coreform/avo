"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const CLIENT_ERROR_STATUS_RE = /\((4\d\d)\)/;

/**
 * Public-facing React Query client. Intentionally simpler than the
 * dashboard's variant: there's no auth concept here, so no 401 handler
 * and no toast surface. Failures bubble up to the consumer (typically
 * via matchQueryStatus → an Errored component).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Best-effort: don't retry on 4xx (they won't get better).
        const message = (error as Error)?.message ?? "";
        if (CLIENT_ERROR_STATUS_RE.test(message)) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000,
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
