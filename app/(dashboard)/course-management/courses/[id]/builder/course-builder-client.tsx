"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Plus,
  Sparkles,
  BookOpen,
  Trash2,
  Edit,
  GripVertical,
  Link2,
  FileText,
  Video,
  FileType,
  MoreVertical,
  Copy,
  Eye,
  Clock,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  deleteCourseTopic,
  reorderTopics,
} from "@/lib/actions/course-topic.actions";
import {
  deleteCourseLesson,
  duplicateCourseLesson,
  reorderLessons,
} from "@/lib/actions/course-lesson.actions";
import { publishCourse } from "../../actions";
import ChapterForm from "./chapter-form";
import { LessonTypeChooser } from "./lesson-type-chooser";
import SyllabusImportDialog from "./syllabus-import-dialog";
import { checkNewSyllabusChapters } from "@/lib/actions/course-syllabus-import.actions";
import { LessonPreviewModal } from "./lesson-preview-modal";

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
    subjectId: string | null;
    chapterId: string | null;
    topicId: string | null;
    sourceType: string;
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

import type { TenantVideoSettings } from "@/types/video-settings";

interface Props {
  course: Course;
  syllabusChapters: Chapter[];
  videoSettings: TenantVideoSettings | null;
}

export default function CourseBuilderClient({
  course,
  syllabusChapters,
  videoSettings,
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
  const [lessonTypeChooserOpen, setLessonTypeChooserOpen] = useState(false);
  const [lessonDeleteDialogOpen, setLessonDeleteDialogOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<
    Course["topics"][number]["lessons"][number] | null
  >(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCheckingNewChapters, setIsCheckingNewChapters] = useState(false);
  const [newChaptersData, setNewChaptersData] = useState<{
    count: number;
    chapters: Array<{
      id: string;
      name: string;
      description: string | null;
      order: number;
    }>;
    subjectName: string;
    subjectIcon: string | null;
  } | null>(null);
  const [showNewChaptersBanner, setShowNewChaptersBanner] = useState(false);
  const [previewLesson, setPreviewLesson] = useState<
    Course["topics"][number]["lessons"][number] | null
  >(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

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

  // Helper function to get lesson type icon
  const getLessonIcon = (lessonType: string) => {
    switch (lessonType) {
      case "TEXT":
        return <FileText className="h-4 w-4" />;
      case "VIDEO_YOUTUBE":
        return <Video className="h-4 w-4" />;
      case "DOCUMENT":
        return <FileType className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Helper function to get lesson type label
  const getLessonTypeLabel = (lessonType: string) => {
    switch (lessonType) {
      case "TEXT":
        return "Text";
      case "VIDEO_YOUTUBE":
        return "Video";
      case "DOCUMENT":
        return "PDF";
      default:
        return lessonType;
    }
  };

  // Helper function to format lesson duration
  const formatLessonDuration = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  // Lesson operations
  const handleDuplicateLesson = async (lessonId: string) => {
    const result = await duplicateCourseLesson(lessonId);
    if (result.success) {
      toast.success("Lesson duplicated successfully");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to duplicate lesson");
    }
  };

  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return;

    const result = await deleteCourseLesson(lessonToDelete.id);
    if (result.success) {
      toast.success("Lesson deleted successfully");
      setLessonDeleteDialogOpen(false);
      setLessonToDelete(null);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete lesson");
    }
  };

  const handleDeleteTopic = async () => {
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

  const handleCheckNewChapters = async () => {
    setIsCheckingNewChapters(true);
    try {
      const result = await checkNewSyllabusChapters(course.id);
      if (result.success) {
        if (result.newChaptersCount > 0) {
          setNewChaptersData({
            count: result.newChaptersCount,
            chapters: result.newChapters,
            subjectName: result.subjectName,
            subjectIcon: result.subjectIcon,
          });
          setShowNewChaptersBanner(true);
        } else {
          toast.success(
            "Everything is up to date. No new chapters in the syllabus."
          );
        }
      } else {
        toast.error(result.error || "Failed to check for new chapters");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to check for new chapters");
    } finally {
      setIsCheckingNewChapters(false);
    }
  };

  // Handle chapter drag and drop
  const handleChapterDragEnd = async (result: any) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    // Reorder topics array
    const reorderedTopics = Array.from(course.topics);
    const [removed] = reorderedTopics.splice(sourceIndex, 1);
    reorderedTopics.splice(destinationIndex, 0, removed);

    // Get new order of topic IDs
    const topicIds = reorderedTopics.map((topic) => topic.id);

    // Call server action
    const reorderResult = await reorderTopics(course.id, topicIds);
    if (reorderResult.success) {
      toast.success("Chapters reordered successfully");
      router.refresh();
    } else {
      toast.error(reorderResult.error || "Failed to reorder chapters");
    }
  };

  // Handle lesson drag and drop
  const handleLessonDragEnd = async (result: any, topicId: string) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    // Find the topic
    const topic = course.topics.find((t) => t.id === topicId);
    if (!topic) return;

    // Reorder lessons array
    const reorderedLessons = Array.from(topic.lessons);
    const [removed] = reorderedLessons.splice(sourceIndex, 1);
    reorderedLessons.splice(destinationIndex, 0, removed);

    // Get new order of lesson IDs
    const lessonIds = reorderedLessons.map((lesson) => lesson.id);

    // Call server action
    const reorderResult = await reorderLessons(topicId, lessonIds);
    if (reorderResult.success) {
      toast.success("Lessons reordered successfully");
      router.refresh();
    } else {
      toast.error(reorderResult.error || "Failed to reorder lessons");
    }
  };

  const renderEmptyState = () => {
    if (!hasAcademicContext) {
      return (
        <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-border bg-linear-to-br from-slate-50 to-violet-50/30 dark:from-slate-900 dark:to-violet-950/20">
          <div className="absolute inset-0 bg-grid-slate-100 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.4))] dark:bg-grid-slate-700/25" />
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
                        `/course-management/courses/${course.slug}/edit`
                      )
                    }
                    className="bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
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
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-linear-to-br from-violet-100 to-indigo-100 dark:from-violet-950 dark:to-indigo-950 shadow-lg">
                  <BookOpen className="h-16 w-16 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-violet-200 dark:border-violet-800 bg-linear-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-950/20 dark:via-slate-900 dark:to-indigo-950/20">
        <div className="absolute inset-0 bg-grid-slate-100 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.4))] dark:bg-grid-slate-700/25" />
        <div className="relative px-8 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-violet-100 to-indigo-100 dark:from-violet-950 dark:to-indigo-950 px-4 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 mb-4">
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
              className="bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
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
            <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-950 shadow-lg">
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
      <div className="relative overflow-hidden rounded-xl border border-border bg-linear-to-br from-violet-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950/30 shadow-sm">
        <div className="absolute inset-0 bg-grid-slate-100 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        <div className="relative px-6 py-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-lg">
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
              {hasAcademicContext && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCheckNewChapters}
                  disabled={isCheckingNewChapters}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  {isCheckingNewChapters ? "Checking..." : "Check new chapters"}
                </Button>
              )}
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
                className="bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
              >
                {isPublishing ? "Publishing..." : "Publish Course"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* New Chapters Banner */}
      {showNewChaptersBanner && newChaptersData && (
        <div className="relative overflow-hidden rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-linear-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30 shadow-sm">
          <div className="absolute inset-0 bg-grid-emerald-100 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-emerald-900/25" />
          <div className="relative px-6 py-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-emerald-600 to-teal-600 text-white shadow-lg">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-100">
                      {newChaptersData.count} new chapter
                      {newChaptersData.count > 1 ? "s" : ""} found in{" "}
                      {newChaptersData.subjectIcon && (
                        <span className="mr-1">
                          {newChaptersData.subjectIcon}
                        </span>
                      )}
                      {newChaptersData.subjectName}
                    </h3>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-0.5">
                      These chapters are available in the syllabus but haven't
                      been imported yet
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowNewChaptersBanner(false);
                    setNewChaptersData(null);
                  }}
                  className="bg-white/80 dark:bg-slate-800/80"
                >
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setImportDialogOpen(true);
                    setShowNewChaptersBanner(false);
                  }}
                  className="bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md"
                >
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Import new chapters
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty vs list */}
      {course.topics.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-5">
          {/* Section header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-100 to-indigo-100 dark:from-violet-950 dark:to-indigo-950 text-violet-700 dark:text-violet-300">
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
            <div className="flex gap-2">
              {hasAcademicContext && syllabusChapters.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => setImportDialogOpen(true)}
                  className="bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                >
                  <Sparkles className="h-4 w-4 mr-1.5" /> Import from Syllabus
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  setEditingChapter(null);
                  setChapterDialogOpen(true);
                }}
                className="bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Add Chapter
              </Button>
            </div>
          </div>

          <DragDropContext onDragEnd={handleChapterDragEnd}>
            <Droppable droppableId="chapters">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {course.topics.map((topic, topicIndex) => (
                    <Draggable
                      key={topic.id}
                      draggableId={topic.id}
                      index={topicIndex}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`group relative overflow-hidden rounded-xl border border-border bg-linear-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm hover:shadow-md transition-all duration-200 ${
                            snapshot.isDragging
                              ? "shadow-lg ring-2 ring-violet-400"
                              : ""
                          }`}
                        >
                          {/* Drag handle - left edge */}
                          <div
                            {...provided.dragHandleProps}
                            className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                          </div>

                          {/* Chapter number badge - floating */}
                          <div className="absolute left-6 top-6 flex h-12 w-12 items-center justify-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-lg">
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
                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                  {/* Syllabus link badge */}
                                  {topic.sourceType === "QUESTION_BANK" &&
                                    (topic.subjectId ||
                                      topic.chapterId ||
                                      topic.topicId) && (
                                      <Badge
                                        variant="outline"
                                        className="rounded-full text-xs px-3 py-1 bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-700"
                                      >
                                        <Link2 className="h-3 w-3 mr-1" />
                                        Linked to syllabus
                                      </Badge>
                                    )}

                                  {/* Lesson count badge */}
                                  <Badge
                                    variant="secondary"
                                    className="rounded-full text-xs px-3 py-1 bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                                  >
                                    {topic.lessons.length}{" "}
                                    {topic.lessons.length === 1
                                      ? "lesson"
                                      : "lessons"}
                                  </Badge>

                                  {/* Empty chapter warning */}
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
                                  onClick={() => {
                                    setLessonDialogTopicId(topic.id);
                                    setLessonTypeChooserOpen(true);
                                  }}
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
                                <DragDropContext
                                  onDragEnd={(result) =>
                                    handleLessonDragEnd(result, topic.id)
                                  }
                                >
                                  <Droppable
                                    droppableId={`lessons-${topic.id}`}
                                  >
                                    {(provided) => (
                                      <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="grid gap-2"
                                      >
                                        {topic.lessons.map(
                                          (lesson, lessonIndex) => (
                                            <Draggable
                                              key={lesson.id}
                                              draggableId={lesson.id}
                                              index={lessonIndex}
                                            >
                                              {(provided, snapshot) => (
                                                <div
                                                  ref={provided.innerRef}
                                                  {...provided.draggableProps}
                                                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-border/40 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all ${
                                                    snapshot.isDragging
                                                      ? "shadow-lg ring-2 ring-violet-400 dark:ring-violet-600"
                                                      : ""
                                                  }`}
                                                >
                                                  {/* Drag Handle */}
                                                  <div
                                                    {...provided.dragHandleProps}
                                                    className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                                  >
                                                    <GripVertical className="h-4 w-4" />
                                                  </div>

                                                  {/* Lesson Icon */}
                                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-100 to-indigo-100 dark:from-violet-950/50 dark:to-indigo-950/50 text-violet-600 dark:text-violet-400 shrink-0">
                                                    {getLessonIcon(
                                                      lesson.lessonType
                                                    )}
                                                  </div>

                                                  {/* Lesson Info */}
                                                  <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">
                                                      {lesson.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                      <Badge
                                                        variant="outline"
                                                        className="rounded-full text-[10px] px-2 py-0.5"
                                                      >
                                                        {getLessonTypeLabel(
                                                          lesson.lessonType
                                                        )}
                                                      </Badge>
                                                      {lesson.duration && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                          <Clock className="h-3 w-3" />
                                                          {formatLessonDuration(
                                                            lesson.duration
                                                          )}
                                                        </div>
                                                      )}
                                                      {lesson.scheduledAt &&
                                                        new Date(
                                                          lesson.scheduledAt
                                                        ) > new Date() && (
                                                          <Badge
                                                            variant="secondary"
                                                            className="rounded-full text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                                                          >
                                                            Scheduled
                                                          </Badge>
                                                        )}
                                                    </div>
                                                  </div>

                                                  {/* Actions Menu */}
                                                  <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                      asChild
                                                    >
                                                      <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                      >
                                                        <MoreVertical className="h-4 w-4" />
                                                      </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                      align="end"
                                                      className="w-48"
                                                    >
                                                      <DropdownMenuItem
                                                        onClick={() => {
                                                          // Navigate to edit lesson page
                                                          router.push(
                                                            `/course-management/courses/${course.slug}/builder/lessons/${lesson.id}/edit`
                                                          );
                                                        }}
                                                      >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem
                                                        onClick={() =>
                                                          handleDuplicateLesson(
                                                            lesson.id
                                                          )
                                                        }
                                                      >
                                                        <Copy className="h-4 w-4 mr-2" />
                                                        Duplicate
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem
                                                        onClick={() => {
                                                          setPreviewLesson(
                                                            lesson
                                                          );
                                                          setPreviewModalOpen(
                                                            true
                                                          );
                                                        }}
                                                      >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Preview
                                                      </DropdownMenuItem>
                                                      <DropdownMenuSeparator />
                                                      <DropdownMenuItem
                                                        onClick={() => {
                                                          setLessonToDelete(
                                                            lesson
                                                          );
                                                          setLessonDeleteDialogOpen(
                                                            true
                                                          );
                                                        }}
                                                        className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                                      >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                      </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                  </DropdownMenu>
                                                </div>
                                              )}
                                            </Draggable>
                                          )
                                        )}
                                        {provided.placeholder}
                                      </div>
                                    )}
                                  </Droppable>
                                </DragDropContext>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
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
        syllabusChapters={syllabusChapters}
        hasAcademicContext={hasAcademicContext}
        onCompleted={() => {
          router.refresh();
          setEditingChapter(null);
        }}
      />

      {/* Lesson Type Chooser */}
      <LessonTypeChooser
        open={lessonTypeChooserOpen}
        onOpenChange={setLessonTypeChooserOpen}
        onSelectType={(type) => {
          setLessonTypeChooserOpen(false);
          if (lessonDialogTopicId) {
            // Navigate to new lesson page
            router.push(
              `/course-management/courses/${
                course.slug
              }/builder/lessons/new?topicId=${lessonDialogTopicId}&type=${type.toLowerCase()}`
            );
          }
        }}
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
        preFilteredChapterIds={newChaptersData?.chapters.map((ch) => ch.id)}
      />

      {/* Delete chapter confirmation */}
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
              onClick={handleDeleteTopic}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete lesson confirmation */}
      <AlertDialog
        open={lessonDeleteDialogOpen}
        onOpenChange={setLessonDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lesson</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete lesson &quot;
                {lessonToDelete?.title}&quot;?
              </p>
              <p className="text-sm">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLesson}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lesson Preview Modal */}
      <LessonPreviewModal
        lesson={previewLesson}
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
      />
    </div>
  );
}
