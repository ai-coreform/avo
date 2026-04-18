import { CHAT_SUGGESTIONS } from "../lib/constants";

interface ChatSuggestionsProps {
  onPick: (suggestion: string) => void;
}

export function ChatSuggestions({ onPick }: ChatSuggestionsProps) {
  return (
    <div className="!mt-3 flex flex-wrap gap-2">
      {CHAT_SUGGESTIONS.map((suggestion) => (
        <button
          className="cursor-pointer rounded-2xl bg-muted px-4 py-2.5 text-foreground text-sm transition-colors hover:bg-muted/70"
          key={suggestion}
          onClick={() => onPick(suggestion)}
          type="button"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
