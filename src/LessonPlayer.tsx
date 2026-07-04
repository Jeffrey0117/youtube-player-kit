"use client";

import { useState, useEffect } from "react";
import { CustomYouTubePlayer } from "./CustomYouTubePlayer";
import type { LessonPlayerProps } from "./types";

/** Convert any YouTube watch/short URL into an /embed/ URL (preserves playlists). */
function convertToYouTubeEmbed(url: string): string {
  if (!url) return url;

  try {
    const urlObj = new URL(url);

    // Already an embed URL
    if (urlObj.pathname.startsWith("/embed/")) {
      return url;
    }

    let videoId = "";
    const params = new URLSearchParams();

    // Handle youtu.be short URLs
    if (urlObj.hostname === "youtu.be" || urlObj.hostname === "www.youtu.be") {
      videoId = urlObj.pathname.slice(1);
    }
    // Handle youtube.com URLs
    else if (urlObj.hostname.includes("youtube.com")) {
      videoId = urlObj.searchParams.get("v") || "";

      // Preserve playlist parameters
      const listId = urlObj.searchParams.get("list");
      const index = urlObj.searchParams.get("index");

      if (listId) {
        params.set("list", listId);
        if (index) {
          params.set("index", index);
          return `https://www.youtube.com/embed/videoseries?${params.toString()}`;
        }
      }
    }

    if (!videoId) {
      // Not a recognizable YouTube URL — return as-is (e.g. self-hosted embed).
      return url;
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const queryString = params.toString();
    return queryString ? `${embedUrl}?${queryString}` : embedUrl;
  } catch {
    return url;
  }
}

/** Extract a YouTube video ID from watch / short / embed URL formats. */
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url);

    if (urlObj.pathname.startsWith("/embed/")) {
      const id = urlObj.pathname.split("/embed/")[1]?.split("?")[0];
      return id || null;
    }

    if (urlObj.hostname === "youtu.be" || urlObj.hostname === "www.youtu.be") {
      return urlObj.pathname.slice(1) || null;
    }

    if (urlObj.hostname.includes("youtube.com")) {
      return urlObj.searchParams.get("v") || null;
    }

    return null;
  } catch {
    return null;
  }
}

function sameOrigin(url: string, base: string): boolean {
  try {
    return new URL(url).origin === new URL(base).origin;
  } catch {
    return false;
  }
}

/**
 * Thin, source-agnostic wrapper around {@link CustomYouTubePlayer} / a plain iframe.
 *
 * When `healthCheckUrl` is provided AND `videoUrl` lives on the same origin, it
 * probes that endpoint on mount; if the probe fails (host down / 5xx / network
 * error / timeout) it degrades gracefully to `fallbackUrl` (typically the
 * original YouTube link). The probe runs entirely in the browser, so a dead
 * primary host still falls back cleanly.
 */
export function LessonPlayer({
  videoUrl,
  fallbackUrl,
  healthCheckUrl,
  useCustomPlayer,
  onProgress,
  onEnded,
  lessonKey,
}: LessonPlayerProps) {
  const canProbe = !!healthCheckUrl && !!videoUrl && !!fallbackUrl && sameOrigin(videoUrl, healthCheckUrl);
  const [primaryDown, setPrimaryDown] = useState(false);

  useEffect(() => {
    setPrimaryDown(false);
    if (!canProbe || !healthCheckUrl) return;
    let cancelled = false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3500);
    (async () => {
      try {
        const res = await fetch(healthCheckUrl, { signal: ctrl.signal, cache: "no-store" });
        if (!res.ok && !cancelled) setPrimaryDown(true);
      } catch {
        // network error / timeout / CORS-rejected error page → treat as down
        if (!cancelled) setPrimaryDown(true);
      } finally {
        clearTimeout(timer);
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [videoUrl, fallbackUrl, healthCheckUrl, canProbe]);

  const effectiveUrl = canProbe && primaryDown && fallbackUrl ? fallbackUrl : videoUrl;

  if (!effectiveUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        <p>此章節尚無影片</p>
      </div>
    );
  }

  // Custom YouTube player only for genuine YouTube URLs; other embeds use the iframe.
  if (useCustomPlayer && /youtu\.?be/.test(effectiveUrl) && extractYouTubeVideoId(effectiveUrl)) {
    return (
      <CustomYouTubePlayer
        videoId={extractYouTubeVideoId(effectiveUrl)!}
        onProgress={onProgress}
        onEnded={onEnded}
        key={`${lessonKey}-${effectiveUrl}`}
      />
    );
  }

  return (
    <iframe
      src={convertToYouTubeEmbed(effectiveUrl)}
      className="w-full h-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      key={`${lessonKey}-${effectiveUrl}`}
    />
  );
}
