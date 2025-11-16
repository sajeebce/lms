"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Mic, Square, Play, Pause, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

interface AudioRecorderDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (audioUrl: string, fileName: string, duration: number, fileSize: number, allowDownload: boolean) => void;
  questionId?: string;
}

export function AudioRecorderDialog({
  open,
  onClose,
  onInsert,
  questionId = "temp",
}: AudioRecorderDialogProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [allowDownload, setAllowDownload] = useState(true); // ✅ Download permission checkbox

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to access microphone. Please check permissions.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      toast.success("Recording stopped");
    }
  };

  // Pause/Resume recording
  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        // Resume timer
        timerRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        // Pause timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }
  };

  // Play/Pause audio
  const togglePlayback = () => {
    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Delete recording
  const deleteRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setIsPlaying(false);
    toast.success("Recording deleted");
  };

  // Upload and insert
  const handleUpload = async () => {
    if (!audioBlob) return;

    setUploading(true);
    try {
      const formData = new FormData();
      const fileName = `audio_${Date.now()}.webm`;
      const file = new File([audioBlob], fileName, { type: "audio/webm" });

      formData.append("file", file);
      formData.append("category", "question_audio");
      formData.append("entityType", "question");
      formData.append("entityId", questionId);
      formData.append("isPublic", "false");
      formData.append("duration", duration.toString()); // ✅ Add duration metadata

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Audio uploaded successfully");
        // Use duration from response (fallback to local duration)
        const audioDuration = data.optimization?.duration || duration;
        onInsert(data.url, data.fileName, audioDuration, data.fileSize, allowDownload);
        handleClose();
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload audio");
    } finally {
      setUploading(false);
    }
  };

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle close
  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setIsPlaying(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Audio</DialogTitle>
          <DialogDescription>
            Record audio for pronunciation questions or voice notes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recording Controls */}
          {!audioBlob && (
            <div className="flex flex-col items-center gap-4 py-8">
              {/* Timer */}
              <div className="text-4xl font-mono font-bold text-slate-700 dark:text-slate-300">
                {formatDuration(duration)}
              </div>

              {/* Recording Status */}
              {isRecording && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {isPaused ? "Paused" : "Recording..."}
                  </span>
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex gap-2">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <>
                    <Button onClick={togglePause} variant="outline">
                      {isPaused ? (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      )}
                    </Button>
                    <Button onClick={stopRecording} variant="destructive">
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Playback Controls */}
          {audioBlob && audioUrl && (
            <div className="space-y-4">
              {/* Audio Player */}
              <audio
                ref={audioPlayerRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />

              {/* Waveform Placeholder / Duration */}
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-mono font-bold text-slate-700 dark:text-slate-300">
                  {formatDuration(duration)}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Audio recorded successfully
                </div>
              </div>

              {/* Download Permission Checkbox */}
              <div className="flex items-center space-x-2 justify-center py-2">
                <Checkbox
                  id="allow-download"
                  checked={allowDownload}
                  onCheckedChange={(checked) => setAllowDownload(checked === true)}
                />
                <Label
                  htmlFor="allow-download"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Allow students to download this audio
                </Label>
              </div>

              {/* Playback Buttons */}
              <div className="flex gap-2 justify-center">
                <Button onClick={togglePlayback} variant="outline">
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Play
                    </>
                  )}
                </Button>
                <Button onClick={deleteRecording} variant="outline">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Insert Audio"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

