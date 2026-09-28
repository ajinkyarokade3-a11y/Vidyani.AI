import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
        <Bot className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        <span className="flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((item) => (
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500"
              key={item}
              style={{ animationDelay: `${item * 150}ms` }}
            />
          ))}
        </span>
        Vidyani AI is thinking...
      </div>
    </div>
  );
}
