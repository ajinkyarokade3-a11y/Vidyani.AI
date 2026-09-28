import { cn } from "@/utils/cn";

type VoiceWaveformProps = {
  active: boolean;
  variant: "ai" | "candidate";
};

export function VoiceWaveform({ active, variant }: VoiceWaveformProps) {
  return (
    <div aria-hidden="true" className="flex h-8 items-center justify-center gap-1">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          className={cn(
            "w-1 rounded-full transition-all",
            variant === "ai" ? "bg-blue-400" : "bg-emerald-400",
            active ? "interview-wave-bar" : "h-1.5 opacity-40"
          )}
          key={index}
          style={active ? { animationDelay: `${index * 90}ms` } : undefined}
        />
      ))}
    </div>
  );
}
