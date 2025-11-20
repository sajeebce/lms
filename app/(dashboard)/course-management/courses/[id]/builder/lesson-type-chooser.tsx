"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Video, FileType, Sparkles } from "lucide-react";

interface LessonTypeChooserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectType: (type: "TEXT" | "VIDEO_YOUTUBE" | "DOCUMENT" | "ADVANCED") => void;
}

export function LessonTypeChooser({
  open,
  onOpenChange,
  onSelectType,
}: LessonTypeChooserProps) {
  const lessonTypes = [
    {
      type: "TEXT" as const,
      icon: FileText,
      title: "Text Lesson",
      description: "Rich text article with formatting and images",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      type: "VIDEO_YOUTUBE" as const,
      icon: Video,
      title: "Video Lesson",
      description: "YouTube, Vimeo, or uploaded video content",
      gradient: "from-red-500 to-pink-500",
    },
    {
      type: "DOCUMENT" as const,
      icon: FileType,
      title: "PDF / Document",
      description: "Upload PDF, DOC, PPT, or other documents",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      type: "ADVANCED" as const,
      icon: Sparkles,
      title: "Advanced / Mixed Content",
      description: "Full editor with text, images, videos, and embeds",
      gradient: "from-violet-500 to-purple-500",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Choose Lesson Type
          </DialogTitle>
          <DialogDescription>
            Select the type of content you want to create for this lesson
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          {lessonTypes.map((lessonType) => {
            const Icon = lessonType.icon;
            return (
              <button
                key={lessonType.type}
                onClick={() => {
                  onSelectType(lessonType.type);
                  onOpenChange(false);
                }}
                className="group relative flex flex-col items-start gap-3 rounded-lg border-2 border-border/60 bg-white dark:bg-slate-900 p-5 text-left transition-all hover:border-violet-400 dark:hover:border-violet-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                {/* Icon */}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${lessonType.gradient} text-white shadow-md group-hover:shadow-lg transition-shadow`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {lessonType.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {lessonType.description}
                  </p>
                </div>

                {/* Hover indicator */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

