"use client";

import { useEffect, useRef, useState, useId } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// YouTube IFrame Player API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubeOverlayConfig {
  topLabel?: string;
  titleText?: string;
  bottomLeftText?: string;
  bottomRightText?: string;
  topBackgroundClass?: string;
  bottomBackgroundClass?: string;
  // Solid color support
  topGradientColor?: string;
  bottomGradientColor?: string;
}

interface CustomYouTubePlayerProps {
  videoId: string;
  watermarkText?: string;
  overlayConfig?: YouTubeOverlayConfig;
  onReady?: () => void;
  onError?: (error: any) => void;
}

export function CustomYouTubePlayer({
  videoId,
  watermarkText,
  overlayConfig,
  onReady,
  onError,
}: CustomYouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerId = `youtube-player-${useId().replace(/:/g, "-")}`; // Unique ID for this player instance
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState<string>("auto");
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 10, y: 10 });
  const [watchTime, setWatchTime] = useState(0);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const youtubeOverlay: YouTubeOverlayConfig | undefined = overlayConfig
    ? {
        topLabel: overlayConfig.topLabel,
        titleText: overlayConfig.titleText,
        bottomLeftText: overlayConfig.bottomLeftText,
        bottomRightText: overlayConfig.bottomRightText,
        topBackgroundClass: overlayConfig.topBackgroundClass,
        bottomBackgroundClass: overlayConfig.bottomBackgroundClass,
        topGradientColor: overlayConfig.topGradientColor,
        bottomGradientColor: overlayConfig.bottomGradientColor,
      }
    : undefined;

  // Load YouTube IFrame API
  useEffect(() => {
    const initializePlayer = () => {
      // Check if container ref is ready
      if (!playerContainerRef.current) {
        console.log("Player container ref not ready");
        return;
      }

      // Destroy existing player if any
      if (playerRef.current) {
        try {
          console.log("Destroying existing player");
          playerRef.current.destroy();
        } catch (e) {
          console.log("Error destroying player:", e);
        }
      }

      console.log(
        "✅ Initializing player with videoId:",
        videoId,
        "playerId:",
        playerId
      );

      try {
        playerRef.current = new window.YT.Player(playerId, {
          videoId: videoId,
          playerVars: {
            controls: 0, // Hide YouTube controls
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            fs: 0, // Disable fullscreen button
            disablekb: 1, // Disable keyboard controls
            iv_load_policy: 3, // Hide annotations
            cc_load_policy: 0, // Hide captions by default
            playsinline: 1,
            autoplay: 0, // Don't autoplay
          },
          events: {
            onReady: handlePlayerReady,
            onStateChange: handleStateChange,
            onError: handlePlayerError,
          },
        });
      } catch (error) {
        console.error("Error initializing player:", error);
        toast.error("Failed to initialize video player");
      }
    };

    // Check if API already loaded
    if (window.YT && window.YT.Player) {
      console.log("YouTube API already loaded");
      initializePlayer();
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    if (existingScript) {
      console.log("YouTube API script already exists, waiting for load");
      window.onYouTubeIframeAPIReady = () => {
        console.log("YouTube API ready (existing script)");
        initializePlayer();
      };
      return;
    }

    // Load API script
    console.log("📥 Loading YouTube API script");
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    tag.onload = () => {
      console.log("📦 YouTube API script loaded");
    };
    tag.onerror = () => {
      console.error("❌ Failed to load YouTube API script");
      toast.error(
        "Failed to load YouTube player. Check your internet connection."
      );
    };
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // API ready callback
    window.onYouTubeIframeAPIReady = () => {
      console.log("🎬 YouTube API ready (new script)");
      initializePlayer();
    };

    return () => {
      if (playerRef.current) {
        try {
          console.log("Destroying player on cleanup");
          playerRef.current.destroy();
          playerRef.current = null;
        } catch (e) {
          console.log("Error during cleanup:", e);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, playerId]);

  const handlePlayerReady = (event: any) => {
    console.log("Player ready event fired");
    setIsReady(true);
    try {
      const dur = event.target.getDuration();
      const vol = event.target.getVolume();
      const qualities = event.target.getAvailableQualityLevels();
      const currentQuality = event.target.getPlaybackQuality();
      console.log("Duration:", dur, "Volume:", vol);
      console.log("Available qualities:", qualities);
      console.log("Current quality:", currentQuality);
      setDuration(dur);
      setAvailableQualities(qualities);
      setVolume(vol);
    } catch (e) {
      console.error("Error getting player info:", e);
    }
    onReady?.();
  };

  const handleStateChange = (event: any) => {
    const state = event.data;
    // YT.PlayerState: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3), CUED (5)
    setIsPlaying(state === 1);

    // When playback starts or buffers, refresh available quality levels
    try {
      if (
        (state === 1 || state === 3) &&
        event.target?.getAvailableQualityLevels
      ) {
        const levels = event.target.getAvailableQualityLevels() || [];
        if (Array.isArray(levels) && levels.length > 0) {
          console.log("Updated available qualities from state change:", levels);
          setAvailableQualities(levels);
        }
      }
    } catch (e) {
      console.log("Error updating available qualities on state change:", e);
    }
  };

  const handlePlayerError = (event: any) => {
    console.error("Player error:", event.data);
    const errorMessages: { [key: number]: string } = {
      2: "Invalid video ID",
      5: "HTML5 player error",
      100: "Video not found or private",
      101: "Video owner does not allow embedding",
      150: "Video owner does not allow embedding",
    };
    const message =
      errorMessages[event.data] || "Failed to load video. Please try again.";
    toast.error(message);
    setIsReady(false);
    onError?.(event);
  };

  // Update current time and watch time periodically
  useEffect(() => {
    if (!isPlaying || !playerRef.current) return;

    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        setWatchTime((prev) => prev + 0.1); // Track watch time
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Animate watermark position
  useEffect(() => {
    if (!watermarkText) return;

    const interval = setInterval(() => {
      setWatermarkPosition({
        x: Math.random() * 80 + 10, // 10% to 90%
        y: Math.random() * 80 + 10, // 10% to 90%
      });
    }, 5000); // Move every 5 seconds

    return () => clearInterval(interval);
  }, [watermarkText]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isReady || !playerRef.current) return;

      // Ignore if user is typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case " ": // Space - Play/Pause
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft": // Left Arrow - Seek backward 5s
          e.preventDefault();
          playerRef.current.seekTo(Math.max(0, currentTime - 5), true);
          break;
        case "ArrowRight": // Right Arrow - Seek forward 5s
          e.preventDefault();
          playerRef.current.seekTo(Math.min(duration, currentTime + 5), true);
          break;
        case "ArrowUp": // Up Arrow - Volume up
          e.preventDefault();
          handleVolumeChange(Math.min(100, volume + 10));
          break;
        case "ArrowDown": // Down Arrow - Volume down
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 10));
          break;
        case "f":
        case "F": // F - Fullscreen
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
        case "M": // M - Mute
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isReady, currentTime, duration, volume, isPlaying]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Control functions
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!playerRef.current) return;
    setVolume(newVolume);
    playerRef.current.setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
      if (volume === 0) {
        handleVolumeChange(50);
      }
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const toggleFullscreen = async () => {
    if (!fullscreenRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await fullscreenRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      toast.error("Fullscreen not supported on this browser.");
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (!playerRef.current) return;
    playerRef.current.setPlaybackRate(rate);
    setPlaybackRate(rate);
    toast.success(`Playback speed: ${rate}x`);
  };

  const changeQuality = (newQuality: string) => {
    if (!playerRef.current) return;

    try {
      // YouTube API quality levels: tiny, small, medium, large, hd720, hd1080, hd1440, hd2160, highres, default
      const qualityMap: { [key: string]: string } = {
        "144p": "tiny",
        "240p": "small",
        "360p": "medium",
        "480p": "large",
        "720p": "hd720",
        "1080p": "hd1080",
        "1440p": "hd1440",
        "2160p": "hd2160",
        auto: "default",
      };

      const youtubeQuality = qualityMap[newQuality] || "default";

      console.log(
        `Changing quality from ${quality} to ${newQuality} (YouTube: ${youtubeQuality})`
      );
      console.log("Available qualities:", availableQualities);

      // Soft-check if quality is available: don't block the click, just warn later
      if (
        youtubeQuality !== "default" &&
        !availableQualities.includes(youtubeQuality)
      ) {
        console.warn(
          `Quality ${youtubeQuality} not reported as available. Available:`,
          availableQualities
        );
      }

      // Set quality
      playerRef.current.setPlaybackQuality(youtubeQuality);

      // Verify quality was set
      setTimeout(() => {
        if (playerRef.current) {
          const actualQuality = playerRef.current.getPlaybackQuality();
          console.log("Quality set to:", actualQuality);

          // Map YouTube quality back to display format
          const displayQualityMap: { [key: string]: string } = {
            tiny: "144p",
            small: "240p",
            medium: "360p",
            large: "480p",
            hd720: "720p",
            hd1080: "1080p",
            hd1440: "1440p",
            hd2160: "2160p",
            highres: "2160p+",
            default: "auto",
          };

          const displayQuality =
            displayQualityMap[actualQuality] || actualQuality;
          setQuality(displayQuality);

          if (
            youtubeQuality !== "default" &&
            actualQuality !== youtubeQuality
          ) {
            toast.warning(
              `YouTube kept quality at ${displayQuality}. This video may not support ${newQuality}.`
            );
          } else {
            toast.success(`Quality changed to ${displayQuality}`);
          }
        }
      }, 500);
    } catch (error) {
      console.error("Error changing quality:", error);
      toast.error("Failed to change quality");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getCompletionRate = () => {
    if (duration === 0) return 0;
    return Math.round((currentTime / duration) * 100);
  };

  const shouldShowPauseChrome = isReady && !isPlaying && currentTime > 0;

  return (
    <div
      ref={fullscreenRef}
      className={`relative w-full rounded-lg overflow-hidden bg-black select-none ${
        isFullscreen ? "fixed inset-0 z-50" : "aspect-video"
      }`}
      onContextMenu={(e) => {
        e.preventDefault();
        toast.error("Right-click is disabled on this video.", {
          duration: 3000,
        });
        return false;
      }}
    >
      {/* YouTube Player (hidden controls) */}
      <div
        ref={playerContainerRef}
        id={playerId}
        className="absolute inset-0 w-full h-full"
      />

      {/* Full overlay to block right-click on iframe */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        style={{ background: "transparent", pointerEvents: "auto" }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toast.error("Right-click is completely disabled.", {
            duration: 3000,
          });
          return false;
        }}
        onClick={(e) => {
          // Check if click is on the video area (not on controls)
          const rect = e.currentTarget.getBoundingClientRect();
          const clickY = e.clientY - rect.top;
          const controlsHeight = 80; // Approximate height of controls area

          // If click is above controls area, toggle play/pause
          if (clickY < rect.height - controlsHeight) {
            e.preventDefault();
            e.stopPropagation();
            togglePlay();
          }
        }}
      />

      {/* Dynamic Animated Watermark Overlay */}
      {watermarkText && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Animated moving watermark */}
          <div
            className="absolute text-white/40 text-xs font-semibold px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm transition-all duration-1000 ease-in-out"
            style={{
              top: `${watermarkPosition.y}%`,
              left: `${watermarkPosition.x}%`,
            }}
          >
            {watermarkText}
          </div>
          {/* Static watermark (bottom-right) */}
          <div className="absolute bottom-20 right-4 text-white/30 text-xs font-semibold px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm">
            {watermarkText}
          </div>
          {/* Center watermark (very subtle) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 text-4xl font-bold rotate-[-15deg]">
            {watermarkText}
          </div>
        </div>
      )}

      {shouldShowPauseChrome && (
        <>
          {/* Top pause overlay bar - Full width solid bar to cover YouTube UI */}
          <div
            className="pointer-events-none absolute top-0 left-0 right-0 z-20 h-[120px]"
            style={{
              backgroundColor: youtubeOverlay?.topGradientColor || "#000000",
            }}
          >
            <div className="flex flex-col gap-2 max-w-[70%]">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 backdrop-blur-sm border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300/90">
                  {youtubeOverlay?.topLabel || "Paused"}
                </span>
              </div>
              <p className="line-clamp-2 text-xs font-medium text-white/90">
                {youtubeOverlay?.titleText || watermarkText || "Secure Lesson"}
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px] text-white/75">
              <span className="rounded-full bg-white/5 px-2 py-[3px] border border-white/10 backdrop-blur-sm">
                {getCompletionRate()}% watched
              </span>
            </div>
          </div>

          {/* Bottom pause overlay bar - Full width solid bar to cover YouTube suggestions */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 h-[300px]"
            style={{
              backgroundColor: youtubeOverlay?.bottomGradientColor || "#000000",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px] text-white/80">
                <span className="rounded-full bg-white/5 px-3 py-1 border border-white/10 backdrop-blur-sm">
                  {youtubeOverlay?.bottomLeftText ||
                    "Suggestions disabled for secure mode"}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-white/60">
                <span className="rounded-full bg-white/5 px-3 py-1 border border-white/10 backdrop-blur-sm">
                  {youtubeOverlay?.bottomRightText || "Focus Mode"}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Custom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-linear-to-t from-black/80 to-transparent p-4">
        <div className="space-y-2">
          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <span className="text-white text-xs font-medium min-w-[45px]">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              disabled={!isReady}
              className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-violet-500
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:w-3
                [&::-moz-range-thumb]:h-3
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-violet-500
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer"
            />
            <span className="text-white text-xs font-medium min-w-[45px]">
              {formatTime(duration)}
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                disabled={!isReady}
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              {/* Volume Control with Slider */}
              <div
                className="relative flex items-center gap-1"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  disabled={!isReady}
                  className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>

                {/* Volume Slider */}
                {showVolumeSlider && (
                  <div className="flex items-center gap-1 bg-black/80 rounded-full px-2.5 py-1.5 backdrop-blur-sm shadow-lg border border-white/10">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) =>
                        handleVolumeChange(parseInt(e.target.value))
                      }
                      disabled={!isReady}
                      className="h-1.5 w-20 md:w-24 lg:w-28 appearance-none bg-white/15 rounded-full cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-3.5
                        [&::-webkit-slider-thumb]:h-3.5
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-violet-400
                        [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(139,92,246,0.35)]
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:w-3.5
                        [&::-moz-range-thumb]:h-3.5
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-violet-400
                        [&::-moz-range-thumb]:border-0
                        [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <span className="text-[10px] font-semibold text-white/80 w-8 text-right">
                      {volume}%
                    </span>
                  </div>
                )}
              </div>

              {/* Time Display */}
              <span className="text-white text-xs font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Playback Speed */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!isReady}
                    className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  >
                    <Gauge className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black/90 border-white/20 backdrop-blur-sm">
                  <DropdownMenuLabel className="text-white">
                    Playback Speed
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/20" />
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <DropdownMenuItem
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={`text-white hover:bg-white/20 cursor-pointer ${
                        playbackRate === rate ? "bg-violet-600" : ""
                      }`}
                    >
                      {rate}x {rate === 1 && "(Normal)"}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Fullscreen */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                disabled={!isReady}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {!isReady && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="text-white text-sm font-medium">Loading video...</div>
        </div>
      )}
    </div>
  );
}
