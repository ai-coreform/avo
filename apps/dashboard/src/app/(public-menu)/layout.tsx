import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ReactQueryProvider } from "@/lib/react-query-provider";

export default function PublicMenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactQueryProvider>
      <NuqsAdapter>{children}</NuqsAdapter>
    </ReactQueryProvider>
  );
}
