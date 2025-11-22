"use client";

import { useState } from "react";
import { SecureVideoPlayer } from "@/components/secure-video-player";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { TenantVideoSettings } from "@/types/video-settings";

const demoVideoSettings: TenantVideoSettings = {
  youtube: {
    pauseOverlay: {
      topLabel: "Paused",
      titleText: "Secure Lesson",
      bottomLeftText: "Suggestions disabled for secure mode",
      bottomRightText: "Focus Mode",
      topBackgroundClass:
        "bg-linear-to-b from-black/90 via-black/60 to-transparent",
      bottomBackgroundClass:
        "bg-linear-to-t from-black/90 via-black/60 to-transparent",
    },
  },
  vdocipher: {
    enabled: false,
    apiKey: "",
    secretKey: "",
  },
};

export default function TestCustomPlayerPage() {
  const [videoUrl, setVideoUrl] = useState(
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  );
  const [watermarkText, setWatermarkText] = useState("John Doe - STU-2025-001");
  const [useCustomPlayer, setUseCustomPlayer] = useState(true);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-orange-500 bg-clip-text text-transparent">
          Custom YouTube Player Test
        </h1>
        <p className="text-muted-foreground mt-2">
          Test the custom YouTube player with dynamic watermark and enhanced
          protection
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Player Settings</CardTitle>
            <CardDescription>Configure the video player</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="videoUrl">YouTube URL</Label>
              <Input
                id="videoUrl"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="watermark">Watermark Text</Label>
              <Input
                id="watermark"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="Student Name - ID"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="customPlayer">Use Custom Player</Label>
              <Switch
                id="customPlayer"
                checked={useCustomPlayer}
                onCheckedChange={setUseCustomPlayer}
              />
            </div>

            <div className="pt-4 space-y-2">
              <Button
                onClick={() =>
                  setVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
                }
                variant="outline"
                className="w-full"
              >
                Sample Video 1
              </Button>
              <Button
                onClick={() =>
                  setVideoUrl("https://www.youtube.com/watch?v=jNQXAC9IVRw")
                }
                variant="outline"
                className="w-full"
              >
                Sample Video 2
              </Button>
            </div>

            <div className="pt-4 border-t space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Features:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✅ Custom controls (play/pause/seek)</li>
                  <li>✅ Animated watermark (moves every 5s)</li>
                  <li>✅ Right-click 100% disabled</li>
                  <li>✅ No YouTube branding</li>
                  <li>✅ Volume slider (0-100%)</li>
                  <li>✅ Playback speed (0.5x - 2x)</li>
                  <li>✅ Quality selector (Auto - 1080p)</li>
                  <li>✅ Fullscreen support</li>
                  <li>✅ Keyboard shortcuts</li>
                  <li>✅ Analytics tracking</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Keyboard Shortcuts:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                      Space
                    </kbd>{" "}
                    - Play/Pause
                  </li>
                  <li>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                      ←
                    </kbd>{" "}
                    - Seek -5s
                  </li>
                  <li>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                      →
                    </kbd>{" "}
                    - Seek +5s
                  </li>
                  <li>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                      ↑
                    </kbd>{" "}
                    - Volume +10%
                  </li>
                  <li>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                      ↓
                    </kbd>{" "}
                    - Volume -10%
                  </li>
                  <li>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                      F
                    </kbd>{" "}
                    - Fullscreen
                  </li>
                  <li>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                      M
                    </kbd>{" "}
                    - Mute
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Player */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Video Player</CardTitle>
            <CardDescription>
              {useCustomPlayer
                ? "Custom player with YouTube IFrame API"
                : "Standard YouTube iframe embed"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SecureVideoPlayer
              videoUrl={videoUrl}
              videoType="VIDEO_YOUTUBE"
              watermarkText={watermarkText}
              useCustomPlayer={useCustomPlayer}
              videoSettings={demoVideoSettings}
            />

            <div className="mt-4 space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Protection Features:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Right-click:</span>{" "}
                    <span className="text-red-600">
                      {useCustomPlayer ? "100% Blocked" : "~85% Blocked"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Watermark:</span>{" "}
                    <span className="text-green-600">
                      {useCustomPlayer ? "Animated" : "Static"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">YouTube branding:</span>{" "}
                    <span className="text-red-600">
                      {useCustomPlayer ? "Hidden" : "Visible"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Custom controls:</span>{" "}
                    <span className="text-green-600">
                      {useCustomPlayer ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              {useCustomPlayer && (
                <div className="p-4 bg-violet-50 dark:bg-violet-950/30 rounded-lg border border-violet-200 dark:border-violet-800">
                  <h4 className="font-semibold mb-2 text-violet-900 dark:text-violet-100">
                    Enhanced Features (Custom Player):
                  </h4>
                  <ul className="text-sm space-y-1 text-violet-700 dark:text-violet-300">
                    <li>🎯 Playback speed control (0.5x - 2x)</li>
                    <li>🎬 Quality selector (Auto - 1080p)</li>
                    <li>🔊 Volume slider (0-100%)</li>
                    <li>⌨️ Keyboard shortcuts (Space, Arrows, F, M)</li>
                    <li>📊 Real-time analytics (watch time, completion)</li>
                    <li>🖥️ Fullscreen support</li>
                    <li>💧 Animated watermark (moves every 5s)</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
