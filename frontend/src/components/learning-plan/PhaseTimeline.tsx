import { PhaseCard } from "@/components/learning-plan/PhaseCard";
import type { YouTubeVideo } from "@/services/youtubeService";
import type { LearningPhase } from "@/types/learning";

type PhaseTimelineProps = {
  completedTopics: Record<string, boolean>;
  loadingTopics: Record<string, boolean>;
  onToggleTopic: (phaseNumber: number, topic: string, completed: boolean) => void;
  phases: LearningPhase[];
  searchQuery?: string;
  visibleTopicCount?: number;
  videos: Record<string, YouTubeVideo[]>;
};

export function PhaseTimeline({
  completedTopics,
  loadingTopics,
  onToggleTopic,
  phases,
  searchQuery = "",
  visibleTopicCount = 0,
  videos,
}: PhaseTimelineProps) {
  const isSearching = searchQuery.trim().length > 0;

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-500">Roadmap</p>
        <h2 className="mt-1 text-xl font-bold tracking-normal text-slate-950">
          Learning Phases
        </h2>
        {isSearching ? (
          <p className="mt-2 text-sm font-semibold text-slate-600">
            {visibleTopicCount > 0
              ? `${visibleTopicCount} topic${visibleTopicCount === 1 ? "" : "s"} found for "${searchQuery}".`
              : `No topics found for "${searchQuery}".`}
          </p>
        ) : null}
      </div>
      {phases.length > 0 ? (
        <div className="grid gap-4">
          {phases
            .slice()
            .sort((first, second) => first.phase_number - second.phase_number)
            .map((phase) => (
              <PhaseCard
                completedTopics={completedTopics}
                key={`${phase.phase_number}-${phase.title}`}
                loadingTopics={loadingTopics}
                onToggleTopic={onToggleTopic}
                phase={phase}
                videos={videos}
              />
            ))}
        </div>
      ) : (
        <div className="glass-panel rounded-[22px] p-6 text-center">
          <p className="text-base font-black text-slate-950">No matches found</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Try a topic, phase name, milestone, or resource type from your roadmap.
          </p>
        </div>
      )}
    </section>
  );
}
