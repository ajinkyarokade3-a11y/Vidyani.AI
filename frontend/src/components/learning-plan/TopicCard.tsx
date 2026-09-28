import { CheckCircle2, Clock3 } from "lucide-react";

import { TopicResourceButton } from "@/components/learning-plan/TopicResourceButton";
import type { YouTubeVideo } from "@/services/youtubeService";

type TopicCardProps = {
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedTime: string | null;
  isCompleted: boolean;
  isVideoLoading: boolean;
  onToggle: (completed: boolean) => void;
  topic: string;
  video: YouTubeVideo | null;
};

export function TopicCard({
  difficulty,
  estimatedTime,
  isCompleted,
  isVideoLoading,
  onToggle,
  topic,
  video,
}: TopicCardProps) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <input
          aria-label={`Mark ${topic} complete`}
          checked={isCompleted}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          onChange={(event) => onToggle(event.target.checked)}
          type="checkbox"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold leading-6 text-slate-950">
                {topic}
              </h4>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  {isVideoLoading
                    ? "Estimating learning time..."
                    : estimatedTime
                      ? `Estimated Time: ${estimatedTime}`
                      : "Estimated time unavailable."}
                </span>
                <span className="rounded-md bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                  {difficulty}
                </span>
                {isCompleted ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Completed
                  </span>
                ) : null}
              </div>
            </div>
            <TopicResourceButton isLoading={isVideoLoading} video={video} />
          </div>
          {video ? (
            <div className="mt-4 flex gap-3 rounded-md bg-slate-50 p-3">
              {video.thumbnailUrl ? (
                <img
                  alt=""
                  className="h-16 w-24 shrink-0 rounded-md object-cover"
                  src={video.thumbnailUrl}
                />
              ) : null}
              <div className="min-w-0">
                <p className="line-clamp-2 text-xs font-semibold leading-5 text-slate-800">
                  {video.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">{video.channel}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
