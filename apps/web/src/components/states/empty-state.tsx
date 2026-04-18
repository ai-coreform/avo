import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@avo/ui/components/ui/alert";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Alert
      className={cn(
        "min-h-80 place-content-center rounded-3xl border-dashed bg-card/60 px-6 py-12 text-center",
        className
      )}
    >
      <AlertTitle className="text-xl">{title}</AlertTitle>
      {description ? (
        <AlertDescription className="mx-auto mt-2 max-w-md">
          {description}
        </AlertDescription>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </Alert>
  );
}
