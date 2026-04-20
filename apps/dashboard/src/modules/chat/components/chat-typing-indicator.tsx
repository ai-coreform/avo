export function ChatTypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="px-1 py-3">
        <div className="flex gap-1.5">
          <div className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
          <div className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
          <div className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
