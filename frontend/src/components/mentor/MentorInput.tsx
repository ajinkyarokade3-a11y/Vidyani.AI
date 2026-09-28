import {
  Bug,
  CircleHelp,
  Lightbulb,
  ListChecks,
  Send,
  Sparkles,
} from "lucide-react";
import { useState, type KeyboardEvent } from "react";

import { Button } from "@/components/common/Button";

const QUICK_ACTIONS = [
  { label: "Explain Simply", prompt: "Explain this simply.", icon: Lightbulb },
  { label: "Give Example", prompt: "Give me a practical example.", icon: Sparkles },
  {
    label: "Generate Practice Question",
    prompt: "Generate a practice question for me.",
    icon: ListChecks,
  },
  { label: "Debug My Code", prompt: "Help me debug my code.", icon: Bug },
  { label: "What's Next?", prompt: "What should I learn next?", icon: CircleHelp },
];

type MentorInputProps = {
  disabled: boolean;
  onSend: (message: string) => void;
};

export function MentorInput({ disabled, onSend }: MentorInputProps) {
  const [message, setMessage] = useState("");

  function submitMessage() {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) {
      return;
    }
    setMessage("");
    onSend(trimmedMessage);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  }

  return (
    <div className="border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:px-5">
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {QUICK_ACTIONS.map(({ icon: Icon, label, prompt }) => (
          <button
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
            disabled={disabled}
            key={label}
            onClick={() => onSend(prompt)}
            type="button"
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-3">
        <textarea
          aria-label="Message AI Mentor"
          className="min-h-12 max-h-36 flex-1 resize-y rounded-md border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
          disabled={disabled}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your roadmap or learning..."
          rows={1}
          value={message}
        />
        <Button
          aria-label="Send message"
          disabled={disabled || !message.trim()}
          onClick={submitMessage}
          size="icon"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
