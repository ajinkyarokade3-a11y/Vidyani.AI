import { Bot, User } from "lucide-react";

import { MentorMarkdown } from "@/components/mentor/MentorMarkdown";
import type { MentorMessage as MentorMessageType } from "@/types/mentor";
import { cn } from "@/utils/cn";

type MentorMessageProps = {
  message: MentorMessageType;
};

export function MentorMessage({ message }: MentorMessageProps) {
  const isUser = message.role === "user";

  return (
    <article
      className={cn(
        "flex gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
          <Bot className="h-4 w-4" aria-hidden="true" />
        </span>
      ) : null}
      <div
        className={cn(
          "max-w-[85%] rounded-md px-4 py-3 shadow-sm sm:max-w-[78%]",
          isUser
            ? "bg-blue-600 text-sm leading-6 text-white"
            : "border border-slate-200 bg-white"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MentorMarkdown content={message.content} />
        )}
      </div>
      {isUser ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-700">
          <User className="h-4 w-4" aria-hidden="true" />
        </span>
      ) : null}
    </article>
  );
}
