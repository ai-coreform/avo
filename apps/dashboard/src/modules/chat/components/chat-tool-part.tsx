import { Button } from "@avo/ui/components/ui/button";
import type { DynamicToolUIPart, ToolUIPart } from "ai";
import { ArrowRight, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  extractMutationChanges,
  type MutationChangeInfo,
} from "../lib/mutation-description";

const MUTATION_TOOL_NAMES = [
  "update_price",
  "update_item",
  "add_item",
  "remove_item",
  "toggle_item_active",
  "create_promo",
  "update_promo",
  "delete_promo",
] as const;

function isMutationToolName(name: string): boolean {
  return (MUTATION_TOOL_NAMES as readonly string[]).includes(name);
}

type AddApproval = (args: {
  id: string;
  approved: boolean;
  reason?: string;
}) => void | PromiseLike<void>;

interface ChatToolPartProps {
  part: ToolUIPart | DynamicToolUIPart;
  partIndex: number;
  toolName: string;
  isBusy: boolean;
  addToolApprovalResponse: AddApproval;
}

function getVariantIcon(variant: MutationChangeInfo["variant"]) {
  switch (variant) {
    case "add":
      return <Plus className="size-4" />;
    case "remove":
      return <Trash2 className="size-4" />;
    default:
      return <Pencil className="size-4" />;
  }
}

function DiffRow({
  change,
}: {
  change: MutationChangeInfo["changes"][number];
}) {
  return (
    <div className="flex items-center gap-3 py-2 text-sm">
      <span className="w-24 flex-shrink-0 text-muted-foreground">
        {change.field}
      </span>
      <div className="flex flex-1 items-center gap-2">
        {change.from ? (
          <>
            <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-destructive line-through">
              {change.from}
            </span>
            <ArrowRight className="size-3.5 flex-shrink-0 text-muted-foreground/50" />
            <span className="rounded-md bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
              {change.to}
            </span>
          </>
        ) : (
          <span className="rounded-md bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
            {change.to}
          </span>
        )}
      </div>
    </div>
  );
}

function ApprovalRequested({
  part,
  toolName,
  isBusy,
  addToolApprovalResponse,
}: {
  part: ToolUIPart | DynamicToolUIPart;
  toolName: string;
  isBusy: boolean;
  addToolApprovalResponse: AddApproval;
}) {
  const inputObj = (part.input ?? {}) as Record<string, unknown>;
  const info = extractMutationChanges(toolName, inputObj);
  const icon = getVariantIcon(info.variant);
  const approvalId = part.approval?.id ?? "";

  return (
    <div className="mt-3 overflow-hidden rounded-2xl ring-1 ring-foreground/10">
      {/* Header */}
      <div className="flex items-center gap-3 bg-primary px-4 py-3">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary-foreground/15 text-primary-foreground">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-primary-foreground text-sm leading-tight">
            {info.itemName}
          </p>
          <p className="text-primary-foreground/70 text-xs">
            {info.actionLabel}
          </p>
        </div>
      </div>

      {/* Changes */}
      {info.changes.length > 0 && (
        <div className="divide-y divide-border/50 bg-card px-4">
          {info.changes.map((change) => (
            <DiffRow change={change} key={change.field} />
          ))}
        </div>
      )}

      {/* Remove confirmation message */}
      {info.variant === "remove" && (
        <div className="bg-card px-4 py-3">
          <p className="text-muted-foreground text-sm">
            Questa azione non puo' essere annullata.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 border-border/50 border-t bg-card px-4 py-3">
        <Button
          className="h-9 flex-1"
          disabled={isBusy}
          onClick={() =>
            addToolApprovalResponse({
              id: approvalId,
              approved: true,
            })
          }
          size="sm"
        >
          <Check className="mr-1.5 size-3.5" />
          Conferma
        </Button>
        <Button
          className="h-9 flex-1"
          disabled={isBusy}
          onClick={() =>
            addToolApprovalResponse({
              id: approvalId,
              approved: false,
              reason: "Annullato dall'utente",
            })
          }
          size="sm"
          variant="outline"
        >
          <X className="mr-1.5 size-3.5" />
          Annulla
        </Button>
      </div>
    </div>
  );
}

function ToolOutput({ part }: { part: ToolUIPart | DynamicToolUIPart }) {
  const out = part.output as { success?: boolean; message?: string };
  if (out.success) {
    return (
      <div className="mt-2 flex items-center gap-2 text-sm">
        <div className="flex size-5 items-center justify-center rounded-full bg-secondary">
          <Check className="size-3 text-secondary-foreground" />
        </div>
        <span className="text-foreground">
          {out.message ?? "Operazione completata"}
        </span>
      </div>
    );
  }
  return (
    <div className="mt-2 flex items-center gap-2 text-destructive text-sm">
      <X className="size-4" />
      <span>{out.message ?? "Operazione non riuscita"}</span>
    </div>
  );
}

function MutationToolPart({
  part,
  toolName,
  isBusy,
  addToolApprovalResponse,
}: ChatToolPartProps) {
  if (part.state === "approval-requested") {
    return (
      <ApprovalRequested
        addToolApprovalResponse={addToolApprovalResponse}
        isBusy={isBusy}
        part={part}
        toolName={toolName}
      />
    );
  }

  if (part.state === "output-available" && part.output) {
    return <ToolOutput part={part} />;
  }

  if (part.state === "output-denied") {
    return (
      <div className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
        <X className="size-4" />
        <span>Annullato</span>
      </div>
    );
  }

  if (part.state === "output-error") {
    return (
      <div className="mt-2 text-destructive text-sm">
        {part.errorText ?? "Errore tool"}
      </div>
    );
  }

  return null;
}

export function ChatToolPart({
  part,
  partIndex,
  toolName,
  isBusy,
  addToolApprovalResponse,
}: ChatToolPartProps) {
  if (isMutationToolName(toolName)) {
    return (
      <MutationToolPart
        addToolApprovalResponse={addToolApprovalResponse}
        isBusy={isBusy}
        part={part}
        partIndex={partIndex}
        toolName={toolName}
      />
    );
  }

  if (part.state === "input-streaming" || part.state === "input-available") {
    return (
      <p className="text-muted-foreground text-sm">Elaborazione in corso...</p>
    );
  }

  if (part.state === "output-available" && part.output != null) {
    const preview =
      typeof part.output === "string"
        ? part.output
        : JSON.stringify(part.output);
    if (preview.length > 280) {
      return (
        <details className="mt-1 text-muted-foreground text-xs">
          <summary className="cursor-pointer">Dettaglio ({toolName})</summary>
          <pre className="mt-1 whitespace-pre-wrap break-all">{preview}</pre>
        </details>
      );
    }
    return null;
  }

  return null;
}
