"use client";

import { Button } from "@avo/ui/components/ui/button";
import { useState } from "react";

/**
 * Monospace display box for a secret with a "Copy" button. Hides the value
 * by default to discourage shoulder-surfing; reveals on click.
 */
export function CredentialsBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{label}</span>
        <div className="flex gap-2">
          <Button
            onClick={() => setRevealed(!revealed)}
            size="sm"
            type="button"
            variant="outline"
          >
            {revealed ? "Nascondi" : "Mostra"}
          </Button>
          <Button
            onClick={handleCopy}
            size="sm"
            type="button"
            variant="outline"
          >
            {copied ? "Copiato" : "Copia"}
          </Button>
        </div>
      </div>
      <div className="break-all rounded-md border bg-muted/40 p-3 font-mono text-xs">
        {revealed ? value : "•".repeat(Math.min(48, value.length))}
      </div>
    </div>
  );
}
