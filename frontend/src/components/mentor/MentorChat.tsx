import { useEffect, useRef } from "react";

import { MentorInput } from "@/components/mentor/MentorInput";
import { MentorMessage } from "@/components/mentor/MentorMessage";
import { MentorSuggestions } from "@/components/mentor/MentorSuggestions";
import { StarterPrompts } from "@/components/mentor/StarterPrompts";
import { TypingIndicator } from "@/components/mentor/TypingIndicator";
import type { MentorMessage as MentorMessageType } from "@/types/mentor";

type MentorChatProps = {
  isLoading: boolean;
  messages: MentorMessageType[];
  onSend: (message: string) => void;
  suggestions: string[];
};

export function MentorChat({
  isLoading,
  messages,
  onSend,
  suggestions,
}: MentorChatProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isLoading, messages, suggestions]);

  return (
    <section className="flex min-h-[calc(100vh-13rem)] flex-col overflow-hidden rounded-md border border-slate-200 bg-slate-50 shadow-sm">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-5">
        {messages.length === 0 ? (
          <StarterPrompts disabled={isLoading} onSelect={onSend} />
        ) : (
          <div className="mx-auto max-w-[900px] space-y-5">
            {messages.map((message, index) => (
              <MentorMessage
                key={`${message.role}-${index}-${message.content.slice(0, 20)}`}
                message={message}
              />
            ))}
            {isLoading ? <TypingIndicator /> : null}
            {!isLoading && messages.at(-1)?.role === "assistant" ? (
              <MentorSuggestions
                disabled={isLoading}
                onSelect={onSend}
                suggestions={suggestions}
              />
            ) : null}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <div className="sticky bottom-0">
        <MentorInput disabled={isLoading} onSend={onSend} />
      </div>
    </section>
  );
}
