"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CustomYouTubePlayer } from "./custom-youtube-player";
import type { TenantVideoSettings } from "@/types/video-settings";

interface SecureVideoPlayerProps {
  videoUrl: string;
  videoType:
    | "VIDEO_YOUTUBE"
    | "VIDEO_VIMEO"
    | "VIDEO_LOCAL"
    | "VIDEO_GDRIVE"
    | "VIDEO_VDOCIPHER";
  watermarkText?: string; // e.g., "Student Name - STU-2025-001"
  allowDownload?: boolean;
  useCustomPlayer?: boolean; // Use custom player with YouTube IFrame API
  videoSettings?: TenantVideoSettings | null;
}

export function SecureVideoPlayer({
  videoUrl,
  videoType,
  watermarkText,
  allowDownload = false,
  useCustomPlayer = true, // Default to custom player for better protection
  videoSettings,
}: SecureVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Disable right-click context menu
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("contextmenu", handleContextMenu);
    }

    return () => {
      if (container) {
        container.removeEventListener("contextmenu", handleContextMenu);
      }
    };
  }, []);

  const renderPlayer = () => {
    // YouTube with custom player or iframe
    if (videoType === "VIDEO_YOUTUBE") {
      const videoId = videoUrl.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/
      )?.[1];

      if (videoId) {
        // Use custom player with YouTube IFrame API
        if (useCustomPlayer) {
          return (
            <CustomYouTubePlayer
              videoId={videoId}
              watermarkText={watermarkText}
              overlayConfig={videoSettings?.youtube?.pauseOverlay}
              onReady={() => {
                console.log("YouTube player ready");
              }}
              onError={(error) => {
                console.error("YouTube player error:", error);
              }}
            />
          );
        }

        // Fallback to standard iframe embed
        const handleContextMenu = (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          toast.error("Right-click is disabled. Video URL cannot be copied.", {
            duration: 3000,
          });
          return false;
        };

        return (
          <div
            className="relative w-full aspect-video rounded-lg overflow-hidden select-none"
            onContextMenu={handleContextMenu}
          >
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1&rel=0&showinfo=0&fs=0&disablekb=0&iv_load_policy=3&cc_load_policy=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title="YouTube Video"
            />

            {/* Overlay covering video area (not controls) to block right-click */}
            {/* Leaves bottom 48px free for YouTube controls */}
            <div
              className="absolute inset-x-0 top-0 bottom-12 z-10"
              style={{
                background: "transparent",
                pointerEvents: "auto",
              }}
              onContextMenu={handleContextMenu}
              onClick={(e) => {
                // Allow single click to pass through for play/pause
                const target = e.currentTarget as HTMLElement;
                target.style.pointerEvents = "none";
                setTimeout(() => {
                  target.style.pointerEvents = "auto";
                }, 100);
              }}
            />

            {/* Top overlay - blocks title/channel name clicks */}
            <div
              className="absolute top-0 left-0 right-0 h-16 z-20"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.05), transparent)",
                pointerEvents: "auto",
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toast.warning(
                  "Please use the video controls below. Do not click on the video title.",
                  {
                    duration: 3000,
                  }
                );
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast.error("Right-click is disabled on this video.", {
                  duration: 3000,
                });
                return false;
              }}
              title="Protected area - Do not click"
            />

            {/* Bottom-right overlay - blocks YouTube logo clicks */}
            <div
              className="absolute bottom-0 right-0 w-28 h-14 z-20"
              style={{ background: "transparent", pointerEvents: "auto" }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toast.warning(
                  "This video is protected. Please watch within this page only.",
                  {
                    duration: 3000,
                  }
                );
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast.error("Right-click is disabled on this video.", {
                  duration: 3000,
                });
                return false;
              }}
              title="Protected area - Do not click"
            />
          </div>
        );
      }
    }

    // Vimeo with restricted UI
    if (videoType === "VIDEO_VIMEO") {
      const videoId = videoUrl.match(/vimeo\.com\/(\d+)/)?.[1];

      if (videoId) {
        return (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="Vimeo Video"
            />
            {/* Transparent overlay covering top area to block clicks on Vimeo branding */}
            <div
              className="absolute top-0 left-0 right-0 h-12 z-10 cursor-default"
              style={{ background: "transparent" }}
              onClick={(e) => e.preventDefault()}
              onMouseDown={(e) => e.preventDefault()}
            />
          </div>
        );
      }
    }

    // VdoCipher (placeholder - requires backend OTP generation)
    if (videoType === "VIDEO_VDOCIPHER") {
      return (
        <div className="w-full aspect-video rounded-lg bg-linear-to-br from-purple-100 to-violet-100 dark:from-purple-950/50 dark:to-violet-950/50 flex items-center justify-center border-2 border-dashed border-purple-300 dark:border-purple-700">
          <div className="text-center p-8">
            <div className="text-purple-600 dark:text-purple-400 mb-4">🎬</div>
            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
              VdoCipher Video
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Video ID: {videoUrl}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
              (Secure player with DRM protection)
            </p>
          </div>
        </div>
      );
    }

    // Local/GDrive video with custom controls
    return (
      <video
        className="w-full aspect-video rounded-lg bg-black"
        controls
        controlsList={allowDownload ? undefined : "nodownload"}
        disablePictureInPicture={false}
        src={videoUrl}
        onContextMenu={(e) => e.preventDefault()}
      >
        Your browser does not support the video tag.
      </video>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }}
    >
      {/* Video Player */}
      {renderPlayer()}

      {/* Watermark Overlay (only for non-custom players) */}
      {watermarkText && !useCustomPlayer && (
        <div className="absolute bottom-4 right-4 pointer-events-none z-10">
          <div
            className="text-white/40 dark:text-white/30 font-semibold text-xs px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm select-none"
            style={{
              textShadow: "0 1px 3px rgba(0,0,0,0.5)",
            }}
          >
            {watermarkText}
          </div>
        </div>
      )}

      {/* Transparent overlay to prevent easy right-click on YouTube/Vimeo iframe */}
      {(videoType === "VIDEO_YOUTUBE" || videoType === "VIDEO_VIMEO") &&
        !useCustomPlayer && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 1 }}
          />
        )}
    </div>
  );
}
