import { ListChecks } from "lucide-react";

import { TopicCard } from "@/components/learning-plan/TopicCard";
import type { YouTubeVideo } from "@/services/youtubeService";
import { getTopicKey } from "@/utils/learningPlan";
import { getEstimatedLearningTime } from "@/utils/youtubeDuration";

type TopicChecklistProps = {
  completedTopics: Record<string, boolean>;
  phaseNumber: number;
  topics: string[];
  videos: Record<string, YouTubeVideo[]>;
  loadingTopics: Record<string, boolean>;
  onToggleTopic: (phaseNumber: number, topic: string, completed: boolean) => void;
};

export function TopicChecklist({
  completedTopics,
  loadingTopics,
  onToggleTopic,
  phaseNumber,
  topics,
  videos,
}: TopicChecklistProps) {
  if (topics.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 rounded-md bg-slate-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-slate-500" aria-hidden="true" />
        <h4 className="text-sm font-semibold text-slate-950">Topics</h4>
      </div>
      <div className="grid gap-3">
        {topics.map((topic, index) => {
          const topicKey = getTopicKey(phaseNumber, topic);
          const topicVideos = videos[topicKey] ?? [];
          return (
            <TopicCard
              difficulty={getDifficulty(index, topics.length)}
              estimatedTime={getEstimatedLearningTime(topicVideos)}
              isCompleted={completedTopics[topicKey] ?? false}
              isVideoLoading={loadingTopics[topicKey] ?? false}
              key={topicKey}
              onToggle={(completed) =>
                onToggleTopic(phaseNumber, topic, completed)
              }
              topic={topic}
              video={topicVideos[0] ?? null}
            />
          );
        })}
      </div>
    </div>
  );
}

function getDifficulty(
  topicIndex: number,
  topicCount: number
): "Beginner" | "Intermediate" | "Advanced" {
  const progress = topicCount <= 1 ? 0 : topicIndex / (topicCount - 1);
  if (progress < 0.34) {
    return "Beginner";
  }
  if (progress < 0.67) {
    return "Intermediate";
  }
  return "Advanced";
}
