import { AlertTriangle, UserRound } from "lucide-react";

import { VoiceWaveform } from "@/components/interview/VoiceWaveform";

type CandidateCardProps = {
  error: string | null;
  isRecording: boolean;
  isSupported: boolean;
  transcript: string;
};

export function CandidateCard({
  error,
  isRecording,
  isSupported,
  transcript,
}: CandidateCardProps) {
  return (
    <article className="flex min-h-52 flex-col rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
            <UserRound className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="font-bold text-slate-950">Candidate</p>
            <p className="mt-0.5 text-xs text-slate-500">Your live response</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
          <span
            className={`h-2 w-2 rounded-full ${
              isRecording ? "bg-red-500" : "bg-emerald-500"
            }`}
          />
          {isRecording ? "Listening..." : transcript ? "Ready" : "Waiting..."}
        </span>
      </div>

      {isRecording ? (
        <div className="mt-2 flex justify-center">
          <VoiceWaveform active variant="candidate" />
        </div>
      ) : null}

      <div
        aria-label="Speech transcript"
        aria-live="polite"
        aria-readonly="true"
        className="mt-4 min-h-24 flex-1 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
        role="textbox"
      >
        {transcript || (
          <span className="text-slate-500">
            Your live transcript will appear here while you speak.
          </span>
        )}
      </div>

      {!isSupported || error ? (
        <div
          className="mt-3 flex gap-2 text-xs leading-5 text-amber-700"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {error ?? "Speech recognition is not supported in this browser."}
          </span>
        </div>
      ) : null}
    </article>
  );
}
