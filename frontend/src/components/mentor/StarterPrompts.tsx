import { Bot, Sparkles } from "lucide-react";

const STARTER_PROMPTS = [
  "Explain Python Dictionaries",
  "How should I study Machine Learning?",
  "Test my understanding of NumPy",
  "Give me a SQL practice question",
];

type StarterPromptsProps = {
  disabled: boolean;
  onSelect: (prompt: string) => void;
};

export function StarterPrompts({
  disabled,
  onSelect,
}: StarterPromptsProps) {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center py-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-200">
        <Bot className="h-8 w-8" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-2xl font-bold text-slate-950">
        Meet Vidyani AI
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
        Ask questions about your roadmap, concepts, coding problems, or anything
        you&apos;re learning.
      </p>
      <div className="mt-7 grid w-full gap-3 sm:grid-cols-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            className="glass-control flex items-start gap-3 rounded-md p-4 text-left text-sm font-semibold leading-6 text-slate-800 transition hover:-translate-y-0.5 hover:border-blue-300 disabled:opacity-50"
            disabled={disabled}
            key={prompt}
            onClick={() => onSelect(prompt)}
            type="button"
          >
            <Sparkles
              className="mt-1 h-4 w-4 shrink-0 text-blue-600"
              aria-hidden="true"
            />
            {prompt}
          </button>
        ))}
      </div>
    </section>
  );
}
