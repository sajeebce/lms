"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteCourseTopic } from "@/lib/actions/course-topic.actions";
import ChapterForm from "./chapter-form";
import LessonForm from "./lesson-form";
import SyllabusImportDialog from "./syllabus-import-dialog";

type Chapter = Awaited<
  ReturnType<typeof import("@/lib/actions/chapter.actions").getChapters>
>[number];

type Course = {
  id: string;
  title: string;
  status: string;
  classId: string | null;
  subjectId: string | null;
  streamId: string | null;
  class: { id: string; name: string } | null;
  subject: { id: string; name: string; icon: string | null } | null;
  stream: { id: string; name: string } | null;
  topics: {
    id: string;
    title: string;
    description: string | null;
    order: number;
    lessons: {
      id: string;
      title: string;
      lessonType: string;
      order: number;
    }[];
  }[];
};

interface Props {
  course: Course;
  syllabusChapters: Chapter[];
}

export default function CourseBuilderClient({ course, syllabusChapters }: Props) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<Course["topics"][number] | null>(
    null,
  );
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [lessonDialogTopicId, setLessonDialogTopicId] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const totalChapters = course.topics.length;
  const totalLessons = course.topics.reduce(
    (sum, topic) => sum + topic.lessons.length,
    0,
  );

  const hasAcademicContext = !!course.subjectId;

  const handleDelete = async () => {
    if (!topicToDelete) return;
    const result = await deleteCourseTopic(topicToDelete.id);
    if (result.success) {
      toast.success("Chapter deleted successfully");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete chapter");
    }
    setDeleteDialogOpen(false);
    setTopicToDelete(null);
  };

  const renderEmptyState = () => {
    if (!hasAcademicContext) {
      return (
        <Card className="border-dashed border-border bg-card text-card-foreground shadow-sm">
          <CardContent className="py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground border border-border/60 mb-3">
                <Sparkles className="h-3 w-3 text-primary" />
                Smart builder works best with Subject linked
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Start with custom chapters – or link a Subject for syllabus import
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl">
                This course is not yet linked to an academic Subject. You can still
                create free-form chapters and lessons, or go back to Basic Info and
                set Class/Stream/Subject for one-click syllabus import.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                className="w-full md:w-auto"
                onClick={() => router.push(`/course-management/courses/${course.id}/edit`)}
              >
                Link Subject &amp; Class
              </Button>
              <Button
                className="w-full md:w-auto"
                onClick={() => setChapterDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Start with custom chapter
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-dashed border-border bg-card text-card-foreground shadow-sm">
        <CardContent className="py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground border border-border/60 mb-3">
              <Sparkles className="h-3 w-3 text-primary" />
              Supercharge from syllabus
            </div>
            <h2 className="text-xl font-semibold mb-2">
              Import chapters from syllabus or build your own path
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              Based on the selected Class/Stream/Subject, you can pull ready-made
              chapters from the academic syllabus. Or ignore that and design a
              completely custom course structure.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {course.subject && (
                <Badge variant="secondary" className="rounded-full">
                  {course.subject.icon && <span className="mr-1">{course.subject.icon}</span>}
                  {course.subject.name}
                </Badge>
              )}
              {course.class && (
                <Badge variant="secondary" className="rounded-full">
                  Class: {course.class.name}
                </Badge>
              )}
              {course.stream && (
                <Badge variant="secondary" className="rounded-full">
                  Stream: {course.stream.name}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <Button
              className="w-full md:w-auto"
              onClick={() => setImportDialogOpen(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Import chapters from syllabus
            </Button>
            <Button
              variant="outline"
              className="w-full md:w-auto"
              onClick={() => setChapterDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Start with custom chapter
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <Card className="bg-card border border-border shadow-sm">
        <CardContent className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{course.title}</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="rounded-full">
                {totalChapters || 0} Chapters
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                {totalLessons || 0} Lessons
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Preview coming soon")}
            >
              Preview Course
            </Button>
            <Button
              size="sm"
              onClick={() => toast.info("Publish flow coming soon")}
            >
              Publish Course
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Empty vs list */}
      {course.topics.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                T
              </span>
              Chapters
            </h2>
            <Button
              size="sm"
              onClick={() => setChapterDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Chapter
            </Button>
          </div>

          <div className="space-y-3">
            {course.topics.map((topic) => (
              <Card
                key={topic.id}
                className="bg-card border border-border hover:border-ring transition-colors"
              >
                <CardHeader className="py-3 flex flex-row items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                        {topic.order}
                      </span>
                      {topic.title}
                    </CardTitle>
                    {topic.description && (
                      <p className="mt-1 text-xs text-muted-foreground max-w-2xl">
                        {topic.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex flex-wrap gap-1 justify-end">
                      <Badge variant="secondary" className="rounded-full text-[11px] px-2 py-0.5">
                        {topic.lessons.length} lessons
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="xs"
                        variant="outline"
                        className="text-[11px] px-2 py-0"
                        onClick={() => setLessonDialogTopicId(topic.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Lesson
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 px-2 py-0 text-[11px]"
                        onClick={() => {
                          setTopicToDelete(topic);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {topic.lessons.length > 0 && (
                  <CardContent className="pt-0 pb-3">
                    <div className="mt-1 space-y-1">
                      {topic.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold">
                              {lesson.order}
                            </span>
                            <span className="font-medium">
                              {lesson.title}
                            </span>
                            <span className="ml-1 rounded-full bg-secondary text-[10px] px-2 py-[1px] text-secondary-foreground">
                              {lesson.lessonType}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <ChapterForm
        open={chapterDialogOpen}
        onOpenChange={setChapterDialogOpen}
        courseId={course.id}
        onCompleted={() => router.refresh()}
      />

      <LessonForm
        open={!!lessonDialogTopicId}
        onOpenChange={(open) => {
          if (!open) setLessonDialogTopicId(null);
        }}
        topicId={lessonDialogTopicId}
        onCompleted={() => router.refresh()}
      />

      <SyllabusImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        courseId={course.id}
        chapters={syllabusChapters}
        existingTopicTitles={course.topics.map((t) => t.title)}
        onCompleted={() => router.refresh()}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chapter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete chapter &quot;{topicToDelete?.title}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

