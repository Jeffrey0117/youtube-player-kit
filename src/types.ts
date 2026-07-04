export interface CustomYouTubePlayerProps {
  /** YouTube video ID (e.g. "dQw4w9WgXcQ") */
  videoId: string;
  /** Called when the video reaches its end */
  onEnded?: () => void;
  /** Progress callback fired ~every 500ms while playing: (currentTime, duration) in seconds */
  onProgress?: (currentTime: number, duration: number) => void;
  /** Render the custom control bar (play/pause, ±10s, volume, seek, fullscreen). Default: true */
  controls?: boolean;
  /** Extra className merged onto the player container */
  className?: string;
}

export interface LessonPlayerProps {
  /** Primary video URL (self-hosted embed, YouTube, etc.) */
  videoUrl: string | null | undefined;
  /** Fallback URL (e.g. original YouTube) used if the health check fails */
  fallbackUrl?: string | null;
  /**
   * Optional health-check endpoint. When set AND the primary URL starts with
   * its origin, the wrapper probes it on mount; if unreachable it swaps to
   * `fallbackUrl`. Source-agnostic — point it at any `GET` that returns 200.
   */
  healthCheckUrl?: string | null;
  /** Use the custom-chrome YouTube player for genuine YouTube URLs. Default: false (plain iframe) */
  useCustomPlayer?: boolean;
  /** Forwarded to CustomYouTubePlayer: (currentTime, duration) in seconds */
  onProgress?: (currentTime: number, duration: number) => void;
  /** Forwarded to CustomYouTubePlayer */
  onEnded?: () => void;
  /** Remount key (change it to force a fresh player on lesson switch) */
  lessonKey?: string;
}
