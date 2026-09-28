import { ExternalLink, LoaderCircle, PlayCircle } from "lucide-react";

import type { YouTubeVideo } from "@/services/youtubeService";

type TopicResourceButtonProps = {
  video: YouTubeVideo | null;
  isLoading: boolean;
};

export function TopicResourceButton({
  isLoading,
  video,
}: TopicResourceButtonProps) {
  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Finding tutorial
      </span>
    );
  }

  if (!video) {
    return null;
  }

  return (
    <a
      className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
      href={video.videoUrl}
      rel="noreferrer"
      target="_blank"
      title={`${video.title} by ${video.channel}`}
    >
      <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
      Watch Tutorial
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}
