import { SendHorizontal } from "lucide-react";

type ChatInputProps = {
  error: string | null;
  isSubmitting: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  value: string;
};

export function ChatInput({
  error,
  isSubmitting,
  onChange,
  onSubmit,
  value,
}: ChatInputProps) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <label
        className="mb-3 block text-sm font-medium text-slate-700"
        htmlFor="learning-goal"
      >
        Describe your learning goal
      </label>
      <textarea
        className="min-h-40 w-full resize-y rounded-md border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 sm:min-h-44"
        disabled={isSubmitting}
        id="learning-goal"
        onChange={(event) => onChange(event.target.value)}
        placeholder='Example: "I want to become a Data Scientist in 6 months with 2 hours of study every day."'
        value={value}
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Include your target role, current level, timeline, and study time.
        </p>
        <button
          className="blue-pill inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          onClick={onSubmit}
          type="button"
        >
          {isSubmitting ? (
            "Generating your learning plan..."
          ) : (
            <>
              <SendHorizontal className="h-4 w-4" aria-hidden="true" />
              Generate Learning Plan
            </>
          )}
        </button>
      </div>
    </section>
  );
}
