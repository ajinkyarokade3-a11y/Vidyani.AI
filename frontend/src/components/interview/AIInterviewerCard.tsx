import { Bot } from "lucide-react";

import { VoiceWaveform } from "@/components/interview/VoiceWaveform";

export type InterviewerStatus =
  | "Speaking..."
  | "Thinking..."
  | "Listening..."
  | "Waiting...";

type AIInterviewerCardProps = {
  status: InterviewerStatus;
};

export function AIInterviewerCard({ status }: AIInterviewerCardProps) {
  const isSpeaking = status === "Speaking...";

  return (
    <article className="flex min-h-52 flex-col justify-between rounded-md border border-blue-400/20 bg-[linear-gradient(145deg,rgba(30,41,59,0.98),rgba(30,58,138,0.28))] p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-950/30">
            <Bot className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="font-bold text-white">AI Interviewer</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Vidyani interview coach
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-200">
          <span
            className={`h-2 w-2 rounded-full ${
              isSpeaking ? "bg-blue-400" : "bg-slate-500"
            }`}
          />
          {status}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-4">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/10">
          {isSpeaking ? (
            <span className="absolute inset-0 animate-ping rounded-full border border-blue-400/30" />
          ) : null}
          <Bot className="relative h-9 w-9 text-blue-300" aria-hidden="true" />
        </div>
        <VoiceWaveform active={isSpeaking} variant="ai" />
      </div>
    </article>
  );
}
