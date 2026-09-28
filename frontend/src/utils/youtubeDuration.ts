type VideoWithDuration = {
  durationSeconds: number | null;
};

export function parseYouTubeDuration(value: string): number | null {
  const match = value.match(
    /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/
  );
  if (!match) {
    return null;
  }

  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const seconds = Number(match[4] ?? 0);
  return days * 86_400 + hours * 3_600 + minutes * 60 + seconds;
}

export function formatLearningTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
  }
  if (minutes > 0) {
    return `${minutes} min`;
  }
  return `${Math.max(totalSeconds, 0)} sec`;
}

export function getEstimatedLearningTime(
  videos: VideoWithDuration[]
): string | null {
  if (
    videos.length === 0 ||
    videos.some((video) => video.durationSeconds === null)
  ) {
    return null;
  }

  const totalSeconds = videos.reduce(
    (total, video) => total + (video.durationSeconds ?? 0),
    0
  );
  return formatLearningTime(totalSeconds);
}
