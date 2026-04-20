import { Bot } from "lucide-react";

export function ChatHeader() {
  return (
    <div className="flex items-center gap-3 border-border border-b bg-card px-4 py-3">
      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Bot className="size-4" />
      </div>
      <div>
        <h2 className="font-semibold text-foreground text-sm">Avo AI</h2>
        <p className="text-muted-foreground text-xs">Assistente menu</p>
      </div>
    </div>
  );
}
