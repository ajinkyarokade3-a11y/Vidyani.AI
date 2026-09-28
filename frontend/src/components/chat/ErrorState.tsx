import { AlertTriangle } from "lucide-react";

type ErrorStateProps = {
  isRetryable?: boolean;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ isRetryable = false, message, onRetry }: ErrorStateProps) {
  return (
    <section className="rounded-md border border-red-200 bg-red-50 p-5">
      <div className="flex gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
          aria-hidden="true"
        />
        <div>
          <h2 className="text-sm font-semibold text-red-950">
            {isRetryable ? "The AI service is temporarily busy" : "Something went wrong"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-red-800">{message}</p>
          {isRetryable && onRetry ? (
            <button
              className="mt-4 inline-flex items-center justify-center rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
              onClick={onRetry}
              type="button"
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
