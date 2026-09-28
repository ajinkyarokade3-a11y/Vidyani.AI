import {
  LogOut,
  Mic,
  Send,
  Square,
  Volume2,
  VolumeOff,
} from "lucide-react";

import { Button } from "@/components/common/Button";

type InterviewControlBarProps = {
  canSubmit: boolean;
  isLoading: boolean;
  isMuted: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  onEnd: () => void;
  onReplay: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSubmit: () => void;
  onToggleMute: () => void;
  recognitionSupported: boolean;
  speechSupported: boolean;
};

export function InterviewControlBar({
  canSubmit,
  isLoading,
  isMuted,
  isRecording,
  isSpeaking,
  onEnd,
  onReplay,
  onStartRecording,
  onStopRecording,
  onSubmit,
  onToggleMute,
  recognitionSupported,
  speechSupported,
}: InterviewControlBarProps) {
  return (
    <section className="rounded-md border border-white/[0.08] bg-[#111827] p-3 shadow-xl">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          disabled={!speechSupported || isMuted || isSpeaking || isLoading}
          onClick={onReplay}
          variant="secondary"
        >
          <Volume2 className="h-4 w-4" aria-hidden="true" />
          Replay
        </Button>
        <Button
          disabled={!speechSupported || isLoading}
          onClick={onToggleMute}
          variant="secondary"
        >
          {isMuted ? (
            <VolumeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Volume2 className="h-4 w-4" aria-hidden="true" />
          )}
          {isMuted ? "Unmute" : "Mute"}
        </Button>

        {isRecording ? (
          <Button
            disabled={isLoading}
            onClick={onStopRecording}
            variant="secondary"
          >
            <Square className="h-4 w-4 fill-current" aria-hidden="true" />
            Stop
          </Button>
        ) : (
          <Button
            disabled={!recognitionSupported || isLoading || isSpeaking}
            onClick={onStartRecording}
          >
            <Mic className="h-4 w-4" aria-hidden="true" />
            Start Recording
          </Button>
        )}

        <Button
          disabled={!canSubmit || isLoading || isRecording}
          onClick={onSubmit}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          {isLoading ? "Submitting..." : "Submit Answer"}
        </Button>
        <Button
          className="border-red-400/30 text-red-200 hover:border-red-300/50 hover:bg-red-500/10"
          disabled={isLoading || isRecording}
          onClick={onEnd}
          variant="secondary"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          End Interview
        </Button>
      </div>
    </section>
  );
}
