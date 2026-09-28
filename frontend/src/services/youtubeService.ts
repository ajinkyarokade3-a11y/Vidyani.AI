import { parseYouTubeDuration } from "@/utils/youtubeDuration";
import {
  loadApiKeys,
  StickyApiKeyPool,
} from "@/utils/apiKeyRotation";

export type YouTubeVideo = {
  title: string;
  channel: string;
  thumbnailUrl: string;
  videoUrl: string;
  durationSeconds: number | null;
};

export class YouTubeSearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YouTubeSearchError";
  }
}

type YouTubeSearchResponse = {
  items?: Array<{
    id?: {
      videoId?: string;
    };
    snippet?: {
      title?: string;
      channelTitle?: string;
      thumbnails?: {
        medium?: {
          url?: string;
        };
        default?: {
          url?: string;
        };
      };
    };
  }>;
};

type YouTubeVideosResponse = {
  items?: Array<{
    id?: string;
    contentDetails?: {
      duration?: string;
    };
  }>;
};

class YouTubeApiError extends YouTubeSearchError {
  constructor(
    message: string,
    readonly retryable: boolean
  ) {
    super(message);
    this.name = "YouTubeApiError";
  }
}

const youtubeApiKeys = loadApiKeys(
  [
    import.meta.env.VITE_YOUTUBE_API_KEY_1,
    import.meta.env.VITE_YOUTUBE_API_KEY_2,
    import.meta.env.VITE_YOUTUBE_API_KEY_3,
    import.meta.env.VITE_YOUTUBE_API_KEY_4,
  ],
  import.meta.env.VITE_YOUTUBE_API_KEY
);
const youtubeKeyPool = new StickyApiKeyPool("YouTube", youtubeApiKeys);
const tutorialCache = new Map<string, YouTubeVideo[]>();
const tutorialErrors = new Map<string, YouTubeSearchError>();
const tutorialRequests = new Map<string, Promise<YouTubeVideo[]>>();

export async function searchYouTubeTutorial(
  topic: string
): Promise<YouTubeVideo | null> {
  const videos = await searchYouTubeTutorials(topic);
  return videos[0] ?? null;
}

export async function searchYouTubeTutorials(
  topic: string
): Promise<YouTubeVideo[]> {
  const topicCacheKey = getTopicCacheKey(topic);

  if (tutorialCache.has(topicCacheKey)) {
    return tutorialCache.get(topicCacheKey) ?? [];
  }
  const cachedError = tutorialErrors.get(topicCacheKey);
  if (cachedError) {
    throw cachedError;
  }

  const activeRequest = tutorialRequests.get(topicCacheKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = fetchYouTubeTutorials(topic, topicCacheKey)
    .catch((error: unknown) => {
      const searchError =
        error instanceof YouTubeSearchError
          ? error
          : new YouTubeSearchError("Unable to load YouTube tutorials.");
      tutorialErrors.set(topicCacheKey, searchError);
      throw searchError;
    })
    .finally(() => {
      tutorialRequests.delete(topicCacheKey);
    });
  tutorialRequests.set(topicCacheKey, request);

  return request;
}

async function fetchYouTubeTutorials(
  topic: string,
  topicCacheKey: string
): Promise<YouTubeVideo[]> {
  const params = new URLSearchParams({
    part: "snippet",
    maxResults: "3",
    q: `${topic} tutorial`,
    safeSearch: "moderate",
    type: "video",
    videoEmbeddable: "true",
  });

  const response = await fetchYouTube("search", params);

  const payload = (await response.json()) as YouTubeSearchResponse;
  const candidates =
    payload.items?.flatMap((item) => {
      const videoId = item.id?.videoId;
      const snippet = item.snippet;
      if (!videoId || !snippet?.title || !snippet.channelTitle) {
        return [];
      }
      return [
        {
          channel: snippet.channelTitle,
          thumbnailUrl:
            snippet.thumbnails?.medium?.url ??
            snippet.thumbnails?.default?.url ??
            "",
          title: decodeHtmlEntities(snippet.title),
          videoId,
        },
      ];
    }) ?? [];

  if (candidates.length === 0) {
    tutorialCache.set(topicCacheKey, []);
    return [];
  }

  const durations = await fetchVideoDurations(
    candidates.map((candidate) => candidate.videoId)
  );
  const videos = candidates.map((candidate) => ({
    title: candidate.title,
    channel: candidate.channel,
    thumbnailUrl: candidate.thumbnailUrl,
    videoUrl: `https://www.youtube.com/watch?v=${candidate.videoId}`,
    durationSeconds: durations.get(candidate.videoId) ?? null,
  }));
  tutorialCache.set(topicCacheKey, videos);
  return videos;
}

async function fetchVideoDurations(
  videoIds: string[]
): Promise<Map<string, number>> {
  if (videoIds.length === 0) {
    return new Map();
  }

  const params = new URLSearchParams({
    part: "contentDetails",
    id: videoIds.join(","),
  });

  try {
    const response = await fetchYouTube("videos", params);

    const payload = (await response.json()) as YouTubeVideosResponse;
    return new Map(
      payload.items?.flatMap((item) => {
        const duration = item.contentDetails?.duration;
        const durationSeconds = duration
          ? parseYouTubeDuration(duration)
          : null;
        return item.id && durationSeconds !== null
          ? [[item.id, durationSeconds] as const]
          : [];
      }) ?? []
    );
  } catch {
    return new Map();
  }
}

async function fetchYouTube(
  resource: "search" | "videos",
  params: URLSearchParams
): Promise<Response> {
  return youtubeKeyPool.execute(async (apiKey) => {
    const requestParams = new URLSearchParams(params);
    requestParams.set("key", apiKey);
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/${resource}?${requestParams.toString()}`
    );
    if (!response.ok) {
      throw await createYouTubeApiError(response);
    }
    return response;
  }, isRetryableYouTubeError);
}

function isRetryableYouTubeError(error: unknown): boolean {
  return error instanceof YouTubeApiError && error.retryable;
}

async function createYouTubeApiError(
  response: Response
): Promise<YouTubeApiError> {
  try {
    const payload = (await response.json()) as {
      error?: {
        message?: string;
        status?: string;
        errors?: Array<{ reason?: string }>;
      };
    };
    const reasons =
      payload.error?.errors?.map((error) => error.reason ?? "") ?? [];
    const retryable =
      response.status === 429 ||
      response.status >= 500 ||
      reasons.some((reason) =>
        [
          "quotaExceeded",
          "rateLimitExceeded",
          "userRateLimitExceeded",
        ].includes(reason)
      );
    const message = payload.error?.message
      ? `YouTube API error: ${payload.error.message}`
      : `YouTube API request failed with status ${response.status}.`;
    return new YouTubeApiError(message, retryable);
  } catch {
    return new YouTubeApiError(
      `YouTube API request failed with status ${response.status}.`,
      response.status === 429 || response.status >= 500
    );
  }
}

function decodeHtmlEntities(value: string): string {
  const parser = new DOMParser();
  return parser.parseFromString(value, "text/html").documentElement.textContent ?? value;
}

function getTopicCacheKey(topic: string): string {
  return topic.trim().toLowerCase();
}
