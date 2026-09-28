import {
  ArrowLeft,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeOff,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/common/Button";
import type { InterviewSummary } from "@/types/interview";
import { formatElapsedTime } from "@/utils/interview";

type InterviewResultsProps = {
  elapsedSeconds: number;
  isMuted: boolean;
  isSpeaking: boolean;
  onDashboard: () => void;
  onRetry: () => void;
  onToggleMute: () => void;
  speechSupported: boolean;
  summary: InterviewSummary;
};

export function InterviewResults({
  elapsedSeconds,
  isMuted,
  isSpeaking,
  onDashboard,
  onRetry,
  onToggleMute,
  speechSupported,
  summary,
}: InterviewResultsProps) {
  const scores = [
    {
      label: "Technical Score",
      value: summary.technical_score,
      icon: Wrench,
    },
    {
      label: "Communication Score",
      value: summary.communication_score,
      icon: MessageSquareText,
    },
    {
      label: "Confidence Score",
      value: summary.confidence_score,
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-violet-600 text-white">
          <Sparkles className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm font-semibold text-blue-600">
          Interview Complete
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
          Your Interview Results
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          {summary.questions_answered} questions answered in{" "}
          {formatElapsedTime(elapsedSeconds)}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button
            disabled={!speechSupported}
            onClick={onToggleMute}
            variant="outline"
          >
            {isMuted ? (
              <VolumeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Volume2 className="h-4 w-4" aria-hidden="true" />
            )}
            {isMuted ? "Unmute" : "Mute"}
          </Button>
          {isSpeaking ? (
            <span
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
              role="status"
            >
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Speaking...
            </span>
          ) : null}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {scores.map(({ icon: Icon, label, value }) => (
          <article
            className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
            key={label}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-blue-600">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-3xl font-bold text-slate-950">{value}</span>
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">{label}</p>
          </article>
        ))}
      </div>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-bold text-slate-950">Overall Feedback</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {summary.overall_feedback}
        </p>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button onClick={onDashboard} variant="outline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Return to Dashboard
        </Button>
        <Button onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry Interview
        </Button>
      </div>
    </div>
  );
}
