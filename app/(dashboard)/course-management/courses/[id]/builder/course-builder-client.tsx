"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Sparkles,
  BookOpen,
  Trash2,
  Edit,
  GripVertical,
} from "lucide-react";
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
import { publishCourse } from "../../actions";
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
  totalTopics: number | null;
  totalLessons: number | null;
  totalDuration: number | null;
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
const formatDuration = (minutes: number | null | undefined) => {
  if (!minutes || minutes <= 0) return "";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs && mins) return `${hrs}h ${mins}m`;
  if (hrs) return `${hrs}h`;
  return `${mins}m`;
};

interface Props {
  course: Course;
  syllabusChapters: Chapter[];
}

export default function CourseBuilderClient({
  course,
  syllabusChapters,
}: Props) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<
    Course["topics"][number] | null
  >(null);
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<
    Course["topics"][number] | null
  >(null);
  const [lessonDialogTopicId, setLessonDialogTopicId] = useState<string | null>(
    null
  );
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const totalChapters = course.topics.length;
  const totalLessons = course.topics.reduce(
    (sum, topic) => sum + topic.lessons.length,
    0
  );

  const topicsForSummary =
    typeof course.totalTopics === "number" && course.totalTopics > 0
      ? course.totalTopics
      : totalChapters;

  const lessonsForSummary =
    typeof course.totalLessons === "number" && course.totalLessons > 0
      ? course.totalLessons
      : totalLessons;

  const durationLabel = formatDuration(course.totalDuration);
  const summaryParts: string[] = [];

  if (course.class?.name) {
    summaryParts.push(course.class.name);
  }

  summaryParts.push(
    `${topicsForSummary} ${topicsForSummary === 1 ? "Chapter" : "Chapters"}`
  );
  summaryParts.push(
    `${lessonsForSummary} ${lessonsForSummary === 1 ? "Lesson" : "Lessons"}`
  );

  if (durationLabel) {
    summaryParts.push(durationLabel);
  }

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

  const handlePublishClick = async () => {
    if (course.status === "PUBLISHED") {
      toast.info("Course is already published");
      return;
    }

    setIsPublishing(true);
    try {
      const result = await publishCourse(course.id);
      if (result.success) {
        if (result.alreadyPublished) {
          toast.success("Course is already published");
        } else {
          toast.success("Course published successfully");
        }
        router.refresh();
      } else {
        toast.error(result.error || "Failed to publish course");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to publish course");
    } finally {
      setIsPublishing(false);
    }
  };

  const renderEmptyState = () => {
    if (!hasAcademicContext) {
      return (
        <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-border bg-gradient-to-br from-slate-50 to-violet-50/30 dark:from-slate-900 dark:to-violet-950/20">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.4))] dark:bg-grid-slate-700/25" />
          <div className="relative px-8 py-12">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-950 px-4 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 mb-4">
                  <Sparkles className="h-3.5 w-3.5" />
                  Syllabus import works best with a Subject
                </div>
                <h2 className="text-2xl font-bold mb-3 text-foreground">
                  Link a Subject to start from syllabus
                </h2>
                <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                  This course is not linked to any academic Subject yet. You can
                  continue with custom chapters and lessons only, or open the
                  course settings to select Class / Stream / Subject for
                  one-click syllabus import.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    onClick={() =>
                      router.push(
                        `/course-management/courses/${course.id}/edit`
                      )
                    }
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Select Subject &amp; Import
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setChapterDialogOpen(true)}
                    className="bg-white/80 dark:bg-slate-800/80"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Custom Chapters Only
                  </Button>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-950 dark:to-indigo-950 shadow-lg">
                  <BookOpen className="h-16 w-16 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-950/20 dark:via-slate-900 dark:to-indigo-950/20">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.4))] dark:bg-grid-slate-700/25" />
        <div className="relative px-8 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-950 dark:to-indigo-950 px-4 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Ready to import from syllabus
            </div>
            <h2 className="text-2xl font-bold mb-3 text-foreground">
              Start from syllabus or build custom?
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              You can import chapters from the Subject  Chapter  Topic tree or
              create custom chapters only for this course.
            </p>
            <div className="flex flex-wrap gap-2">
              {course.class && (
                <Badge
                  variant="secondary"
                  className="rounded-full px-3 py-1.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                >
                  Class: {course.class.name}
                </Badge>
              )}
              {course.stream && (
                <Badge
                  variant="secondary"
                  className="rounded-full px-3 py-1.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                >
                  Stream: {course.stream.name}
                </Badge>
              )}
              {course.subject && (
                <Badge
                  variant="secondary"
                  className="rounded-full px-3 py-1.5 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                >
                  {course.subject.icon && (
                    <span className="mr-1.5">{course.subject.icon}</span>
                  )}
                  {course.subject.name}
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => setImportDialogOpen(true)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Import from Syllabus
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setChapterDialogOpen(true)}
              className="bg-white/80 dark:bg-slate-800/80"
            >
              <Plus className="h-4 w-4 mr-2" />
              Custom Chapters
            </Button>
          </div>
          <div className="hidden md:block">
            <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-950 shadow-lg">
              <Sparkles className="h-16 w-16 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header strip - Enhanced */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950/30 shadow-sm">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        <div className="relative px-6 py-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">
                    {course.title}
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {summaryParts.join(" • ")}
                  </p>
                </div>
              </div>
              {/* Academic scope badges */}
              {(course.class || course.stream || course.subject) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {course.class && (
                    <Badge
                      variant="secondary"
                      className="rounded-full px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    >
                      Class: {course.class.name}
                    </Badge>
                  )}
                  {course.stream && (
                    <Badge
                      variant="secondary"
                      className="rounded-full px-3 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                    >
                      Stream: {course.stream.name}
                    </Badge>
                  )}
                  {course.subject && (
                    <Badge
                      variant="secondary"
                      className="rounded-full px-3 py-1 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    >
                      {course.subject.icon && (
                        <span className="mr-1">{course.subject.icon}</span>
                      )}
                      {course.subject.name}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Preview coming soon")}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
              >
                Preview Course
              </Button>
              <Button
                size="sm"
                onClick={handlePublishClick}
                disabled={isPublishing}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
              >
                {isPublishing ? "Publishing..." : "Publish Course"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Empty vs list */}
      {course.topics.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-5">
          {/* Section header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-950 dark:to-indigo-950 text-violet-700 dark:text-violet-300">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Chapters
                </h2>
                <p className="text-xs text-muted-foreground">
                  Organize your course content into chapters and lessons
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingChapter(null);
                setChapterDialogOpen(true);
              }}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Chapter
            </Button>
          </div>

          <div className="space-y-4">
            {course.topics.map((topic, index) => (
              <div
                key={topic.id}
                className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* Drag handle - left edge */}
                <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Chapter number badge - floating */}
                <div className="absolute left-6 top-6 flex h-12 w-12 items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-lg">
                    {topic.order}
                  </div>
                </div>

                <div className="pl-20 pr-6 py-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Left: Title & Description */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-foreground mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {topic.title}
                      </h3>
                      {topic.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 max-w-2xl">
                          {topic.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <Badge
                          variant="secondary"
                          className="rounded-full text-xs px-3 py-1 bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                        >
                          {topic.lessons.length}{" "}
                          {topic.lessons.length === 1 ? "lesson" : "lessons"}
                        </Badge>
                        {topic.lessons.length === 0 && (
                          <Badge
                            variant="outline"
                            className="rounded-full text-xs px-3 py-1 text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700"
                          >
                            Empty chapter
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLessonDialogTopicId(topic.id)}
                        className="bg-white/80 dark:bg-slate-800/80 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:border-violet-300 dark:hover:border-violet-700"
                      >
                        <Plus className="h-4 w-4 mr-1.5" /> Add Lesson
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingChapter(topic);
                          setChapterDialogOpen(true);
                        }}
                        className="bg-white/80 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700"
                      >
                        <Edit className="h-4 w-4 mr-1.5" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                        onClick={() => {
                          setTopicToDelete(topic);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                      </Button>
                    </div>
                  </div>

                  {/* Lessons list (if any) */}
                  {topic.lessons.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/60">
                      <div className="grid gap-2">
                        {topic.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-border/40 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                          >
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-medium text-muted-foreground">
                              {lessonIndex + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {lesson.title}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="rounded-full text-[10px] px-2 py-0.5 shrink-0"
                            >
                              {lesson.lessonType}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <ChapterForm
        open={chapterDialogOpen}
        onOpenChange={(open) => {
          setChapterDialogOpen(open);
          if (!open) setEditingChapter(null);
        }}
        courseId={course.id}
        editingChapter={editingChapter}
        onCompleted={() => {
          router.refresh();
          setEditingChapter(null);
        }}
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
        courseClass={course.class}
        courseStream={course.stream}
        courseSubject={course.subject}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chapter</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete chapter &quot;
                {topicToDelete?.title}&quot;?
              </p>
              {topicToDelete && topicToDelete.lessons.length > 0 && (
                <p className="text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ This chapter has {topicToDelete.lessons.length}{" "}
                  {topicToDelete.lessons.length === 1 ? "lesson" : "lessons"}.
                  All lessons will be deleted.
                </p>
              )}
              <p className="text-sm">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
