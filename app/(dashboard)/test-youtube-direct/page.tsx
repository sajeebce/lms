"use client";

import { CustomYouTubePlayer } from "@/components/custom-youtube-player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestYouTubeDirectPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Direct YouTube Player Test</h1>
        <p className="text-muted-foreground mt-2">
          Testing CustomYouTubePlayer component directly (no wrapper)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Video 1: Rick Astley - Never Gonna Give You Up</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomYouTubePlayer
            videoId="dQw4w9WgXcQ"
            watermarkText="Test User - 001"
            onReady={() => console.log("✅ Player 1 ready")}
            onError={(error) => console.error("❌ Player 1 error:", error)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Video 2: Big Buck Bunny</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomYouTubePlayer
            videoId="aqz-KE-bpKQ"
            watermarkText="Test User - 002"
            onReady={() => console.log("✅ Player 2 ready")}
            onError={(error) => console.error("❌ Player 2 error:", error)}
          />
        </CardContent>
      </Card>

      <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
          🔍 Debug Instructions:
        </h3>
        <ol className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-decimal list-inside">
          <li>Open browser console (F12)</li>
          <li>Look for "Loading YouTube API script" message</li>
          <li>Look for "YouTube API ready" message</li>
          <li>Look for "Initializing player with videoId" message</li>
          <li>Look for "Player ready event fired" message</li>
          <li>If you see errors, copy and share them</li>
        </ol>
      </div>
    </div>
  );
}

