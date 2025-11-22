"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Video,
  FileType,
  Clock,
  Download,
  ExternalLink,
  Lock,
  Eye,
} from "lucide-react";
import { SecureDocumentViewer } from "@/components/secure-document-viewer";
import { SecureVideoPlayer } from "@/components/secure-video-player";
import type { TenantVideoSettings } from "@/types/video-settings";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  lessonType: string;
  videoUrl: string | null;
  documentPath: string | null;
  textContent: string | null;
  duration: number | null;
  accessType: string;
  password: string | null;
  allowDownload: boolean;
  isPreview: boolean;
};

interface LessonPreviewModalProps {
  lesson: Lesson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoSettings?: TenantVideoSettings | null;
}

export function LessonPreviewModal({
  lesson,
  open,
  onOpenChange,
  videoSettings,
}: LessonPreviewModalProps) {
  const [passwordInput, setPasswordInput] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  if (!lesson) return null;

  const needsPassword =
    lesson.accessType === "PASSWORD" && !isUnlocked && !lesson.isPreview;

  const handlePasswordSubmit = () => {
    if (passwordInput === lesson.password) {
      setIsUnlocked(true);
    } else {
      alert("Incorrect password");
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "TEXT":
        return <FileText className="h-5 w-5" />;
      case "VIDEO_YOUTUBE":
      case "VIDEO_VIMEO":
      case "VIDEO_URL":
      case "VIDEO_UPLOAD":
        return <Video className="h-5 w-5" />;
      case "DOCUMENT":
        return <FileType className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getLessonTypeLabel = (type: string) => {
    if (type.startsWith("VIDEO_")) return "Video";
    if (type === "TEXT") return "Text";
    if (type === "DOCUMENT") return "Document";
    return type;
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Generate watermark text (in real app, this would come from current user)
  const getWatermarkText = () => {
    const now = new Date();
    const timestamp = now.toLocaleString();
    return `Preview Mode - ${timestamp}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-violet-100 to-indigo-100 dark:from-violet-950/50 dark:to-indigo-950/50 text-violet-600 dark:text-violet-400">
              {getLessonIcon(lesson.lessonType)}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{lesson.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">
                  {getLessonTypeLabel(lesson.lessonType)}
                </Badge>
                {lesson.duration && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatDuration(lesson.duration)}
                  </div>
                )}
                {lesson.accessType === "PASSWORD" && (
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Password Protected
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Password Gate */}
        {needsPassword ? (
          <div className="py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/50 mx-auto mb-4">
              <Lock className="h-8 w-8 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              This lesson is password protected
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Enter the password to view the content
            </p>
            <div className="flex gap-2 max-w-sm mx-auto">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                className="flex-1 px-3 py-2 border rounded-lg"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePasswordSubmit();
                }}
              />
              <Button onClick={handlePasswordSubmit}>Unlock</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Description */}
            {lesson.description && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {lesson.description}
                </p>
              </div>
            )}

            {/* Content based on lesson type */}
            {lesson.lessonType.startsWith("VIDEO_") && lesson.videoUrl && (
              <SecureVideoPlayer
                videoUrl={lesson.videoUrl}
                videoType={lesson.lessonType as any}
                watermarkText={getWatermarkText()}
                allowDownload={lesson.allowDownload}
                videoSettings={videoSettings}
              />
            )}

            {lesson.lessonType === "TEXT" && lesson.textContent && (
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: lesson.textContent }}
              />
            )}

            {lesson.lessonType === "DOCUMENT" && lesson.documentPath && (
              <div className="space-y-4">
                {/* Document Info Header */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/50">
                      <FileType className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">
                        {lesson.documentPath.split("/").pop()}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {lesson.allowDownload
                          ? "Download allowed"
                          : "View only (protected)"}
                      </p>
                    </div>
                  </div>
                  {!lesson.allowDownload && (
                    <Badge variant="secondary" className="gap-1">
                      <Eye className="h-3 w-3" />
                      Protected
                    </Badge>
                  )}
                </div>

                {/* Secure Document Viewer */}
                <SecureDocumentViewer
                  documentUrl={lesson.documentPath}
                  fileName={lesson.documentPath.split("/").pop() || "document"}
                  allowDownload={lesson.allowDownload}
                  watermarkText={getWatermarkText()}
                />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
