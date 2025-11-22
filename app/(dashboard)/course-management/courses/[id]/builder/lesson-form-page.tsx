"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { LessonFormContent } from "./lesson-form-content";

interface LessonFormPageProps {
  courseId: string;
  courseTitle: string;
  topicId: string;
  topicTitle: string;
  lessonType: "TEXT" | "VIDEO_YOUTUBE" | "DOCUMENT" | "ADVANCED";
  mode: "create" | "edit";
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
    topicId: string;
  } | null;
}

export function LessonFormPage({
  courseId,
  courseTitle,
  topicId,
  topicTitle,
  lessonType,
  mode,
  editingLesson,
}: LessonFormPageProps) {
  const router = useRouter();
  const isEditing = mode === "edit";

  const handleCancel = () => {
    router.push(`/course-management/courses/${courseId}/builder`);
  };

  const handleCompleted = () => {
    router.push(`/course-management/courses/${courseId}/builder`);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Builder
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-semibold bg-linear-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  {isEditing ? "Edit Lesson" : "Add New Lesson"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {courseTitle} → {topicTitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {lessonType.replace("_", " ").toLowerCase()}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Lesson Details</CardTitle>
          </CardHeader>
          <CardContent>
            <LessonFormContent
              topicId={topicId}
              lessonType={lessonType}
              editingLesson={editingLesson}
              onCompleted={handleCompleted}
              onCancel={handleCancel}
              mode="page"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

