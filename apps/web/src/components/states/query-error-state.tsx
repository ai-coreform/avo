import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@avo/ui/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { getUserFriendlyMessage, parseError } from "@/lib/api-error";
import { cn } from "@/lib/utils";

interface QueryErrorStateProps {
  error: unknown;
  title: string;
  description?: ReactNode;
  className?: string;
}

export function QueryErrorState({
  error,
  title,
  description,
  className,
}: QueryErrorStateProps) {
  const parsedError = parseError(error);
  const content =
    description ??
    getUserFriendlyMessage(
      parsedError.code,
      parsedError.message,
      parsedError.details
    );

  return (
    <Alert className={cn(className)} variant="destructive">
      <AlertCircle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{content}</AlertDescription>
    </Alert>
  );
}
