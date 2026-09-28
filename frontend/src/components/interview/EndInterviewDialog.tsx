import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/common/Button";

type EndInterviewDialogProps = {
  isEnding: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
};

export function EndInterviewDialog({
  isEnding,
  onCancel,
  onConfirm,
  open,
}: EndInterviewDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      aria-labelledby="end-interview-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4"
      role="dialog"
    >
      <section className="w-full max-w-md rounded-md border border-white/10 bg-[#1A2235] p-6 shadow-2xl">
        <span className="flex h-11 w-11 items-center justify-center rounded-md bg-red-500/10 text-red-400">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2
          className="mt-4 text-xl font-bold text-white"
          id="end-interview-title"
        >
          End this interview?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Your submitted answers will be summarized. The current unanswered
          question will not be included.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button disabled={isEnding} onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button
            className="bg-red-600 shadow-none hover:bg-red-500"
            disabled={isEnding}
            onClick={onConfirm}
          >
            {isEnding ? "Ending..." : "End Interview"}
          </Button>
        </div>
      </section>
    </div>
  );
}
