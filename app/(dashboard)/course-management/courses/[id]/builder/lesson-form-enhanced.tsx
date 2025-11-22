"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LessonFormContent } from "./lesson-form-content";

interface LessonFormEnhancedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: string | null;
  lessonType: "TEXT" | "VIDEO_YOUTUBE" | "DOCUMENT" | "ADVANCED";
  editingLesson?: {
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
    isPreview: boolean;
    allowDownload: boolean;
    scheduledAt: Date | null;
    attachmentsJson: string | null;
  } | null;
  onCompleted?: () => void;
}

/**
 * LessonFormEnhanced - Modal wrapper for lesson form
 * This component wraps LessonFormContent in a Dialog for modal display
 */
export function LessonFormEnhanced({
  open,
  onOpenChange,
  topicId,
  lessonType,
  editingLesson,
  onCompleted,
}: LessonFormEnhancedProps) {
  const isEditing = !!editingLesson;

  const handleCompleted = () => {
    onOpenChange(false);
    onCompleted?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-linear-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            {isEditing ? "Edit Lesson" : "Add Lesson"}
          </DialogTitle>
        </DialogHeader>

        <LessonFormContent
          topicId={topicId}
          lessonType={lessonType}
          editingLesson={editingLesson}
          onCompleted={handleCompleted}
          mode="modal"
        />
      </DialogContent>
    </Dialog>
  );
}
