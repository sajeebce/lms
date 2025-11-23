"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Package,
  BookOpen,
  Grid3x3,
  List,
  Copy,
  Rocket,
  MoreHorizontal,
  Share2,
  BarChart3,
  MonitorSmartphone,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  deleteCourse,
  duplicateCourse,
  publishCourse,
  updateCourseStatus,
} from "./actions";

type CourseStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "PRIVATE";

const COURSE_STATUS_OPTIONS: { value: CourseStatus; label: string }[] = [
  { value: "DRAFT", label: "📝 Draft" },
  { value: "PUBLISHED", label: "✅ Published" },
  { value: "SCHEDULED", label: "⏰ Scheduled" },
  { value: "PRIVATE", label: "🔒 Private" },
];

const STATUS_STYLES: Record<CourseStatus, string> = {
  DRAFT:
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  PUBLISHED:
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  PRIVATE:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

type Course = {
  id: string;
  title: string;
  slug: string;
  courseType: string;
  status: CourseStatus;
  visibility: "PUBLIC" | "UNLISTED" | "PRIVATE" | "INTERNAL_ONLY";
  isFeatured: boolean;
  category: { id: string; name: string; icon: string | null } | null;
  class: { id: string; name: string; alias: string | null } | null;
  subject: { id: string; name: string; icon: string | null } | null;
  stream: { id: string; name: string } | null;
  featuredImage: string | null;
  comingSoonImage: string | null;
  authorName: string | null;
  instructor: { id: string; name: string } | null;
  paymentType: string;
  regularPrice: number | null;
  offerPrice: number | null;
  currency: string;
  totalTopics: number;
  totalLessons: number;
  totalEnrollments: number;
  fakeEnrollmentCount: number | null;
  createdAt: Date;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  showComingSoon: boolean;
  allowCurriculumPreview: boolean;
  maxStudents: number | null;
  enrollmentStatus: "OPEN" | "PAUSED" | "CLOSED" | "INVITE_ONLY";
  enrollmentStartAt: Date | null;
  enrollmentEndAt: Date | null;
  _count: {
    enrollments: number;
    topics: number;
  };
};

type Category = {
  id: string;
  name: string;
  icon: string | null;
};

type Subject = {
  id: string;
  name: string;
  icon: string | null;
};

type Class = {
  id: string;
  name: string;
  alias: string | null;
};

type Stream = {
  id: string;
  name: string;
};

type Props = {
  courses: Course[];
  categories: Category[];
  subjects: Subject[];
  classes: Class[];
  streams: Stream[];
};

const formatDateTime = (date: Date | null) => {
  if (!date) return "—";
  try {
    // Use en-US locale for consistent server/client rendering
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return "—";
  }
};

const getDisplayedEnrollmentCount = (course: Course) => {
  return (
    course.fakeEnrollmentCount ??
    course.totalEnrollments ??
    course._count.enrollments
  );
};
const getCourseDisplayImage = (course: Course) => {
  if (course.status === "SCHEDULED" && course.comingSoonImage) {
    return course.comingSoonImage;
  }
  return course.featuredImage;
};

const getCourseMetaLine = (course: Course) => {
  const topics =
    course.totalTopics && course.totalTopics > 0
      ? course.totalTopics
      : course._count.topics;
  const lessons = course.totalLessons ?? 0;
  const enrollments = getDisplayedEnrollmentCount(course);

  return `${topics.toLocaleString()} Topics · ${lessons.toLocaleString()} Lessons · ${enrollments.toLocaleString()} Enrollments`;
};

export default function CoursesClient({
  courses: initialCourses,
  categories,
  subjects,
  classes,
  streams,
}: Props) {
  const router = useRouter();
  const [courses, setCourses] = useState(initialCourses);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterVisibility, setFilterVisibility] = useState("");
  const [filterEnrollmentStatus, setFilterEnrollmentStatus] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterStream, setFilterStream] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [duplicatingCourseId, setDuplicatingCourseId] = useState<string | null>(
    null
  );
  const [publishingCourseId, setPublishingCourseId] = useState<string | null>(
    null
  );
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      !filterCategory || course.category?.id === filterCategory;
    const matchesType = !filterType || course.courseType === filterType;
    const matchesStatus = !filterStatus || course.status === filterStatus;
    const matchesVisibility =
      !filterVisibility || course.visibility === filterVisibility;
    const matchesEnrollmentStatus =
      !filterEnrollmentStatus ||
      course.enrollmentStatus === filterEnrollmentStatus;
    const matchesClass = !filterClass || course.class?.id === filterClass;
    const matchesSubject =
      !filterSubject || course.subject?.id === filterSubject;
    const matchesStream = !filterStream || course.stream?.id === filterStream;
    return (
      matchesSearch &&
      matchesCategory &&
      matchesType &&
      matchesStatus &&
      matchesVisibility &&
      matchesEnrollmentStatus &&
      matchesClass &&
      matchesSubject &&
      matchesStream
    );
  });

  const allSelected =
    filteredCourses.length > 0 &&
    selectedCourseIds.length === filteredCourses.length;
  const someSelected =
    selectedCourseIds.length > 0 &&
    selectedCourseIds.length < filteredCourses.length;

  const confirmDelete = async () => {
    if (!courseToDelete) return;

    const result = await deleteCourse(courseToDelete.id);
    if (result.success) {
      toast.success("Course deleted successfully");
      setCourses(courses.filter((c) => c.id !== courseToDelete.id));
    } else {
      toast.error(result.error || "Failed to delete course");
    }
    setDeleteDialogOpen(false);
    setCourseToDelete(null);
  };

  const handleDuplicate = async (course: Course) => {
    setDuplicatingCourseId(course.id);
    try {
      const result = await duplicateCourse(course.id);
      if (result.success) {
        toast.success("Course duplicated as draft");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to duplicate course");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to duplicate course");
    } finally {
      setDuplicatingCourseId(null);
    }
  };

  const handlePublish = async (course: Course) => {
    if (course.status === "PUBLISHED") {
      toast.info("Course is already published");
      return;
    }

    setPublishingCourseId(course.id);
    try {
      const result = await publishCourse(course.id);
      if (result.success) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === course.id ? { ...c, status: "PUBLISHED" } : c
          )
        );
        if (result.alreadyPublished) {
          toast.success("Course is already published");
        } else {
          toast.success("Course published successfully");
        }
      } else {
        toast.error(result.error || "Failed to publish course");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to publish course");
    } finally {
      setPublishingCourseId(null);
    }
  };

  const handleStatusChange = async (
    course: Course,
    newStatus: CourseStatus
  ) => {
    if (!newStatus || newStatus === course.status) {
      return;
    }

    setUpdatingStatusId(course.id);
    try {
      const result = await updateCourseStatus({
        id: course.id,
        status: newStatus,
      });
      if (result.success) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === course.id ? { ...c, status: newStatus } : c
          )
        );
        toast.success(`Status updated to ${newStatus}`);
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const getScheduleBadgeLegacy = (course: Course) => {
    if (course.status !== "SCHEDULED" || !course.scheduledAt) return null;

    const now = new Date();
    const isFuture = course.scheduledAt.getTime() > now.getTime();

    if (!isFuture) {
      return (
        <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-[2px] text-[11px] font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
          Started {formatDateTime(course.scheduledAt)}
        </span>
      );
    }

    if (course.showComingSoon) {
      return (
        <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-[2px] text-[11px] font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
          Coming soon  b7 {formatDateTime(course.scheduledAt)}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-[2px] text-[11px] font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
        Starts {formatDateTime(course.scheduledAt)}
      </span>
    );
  };
  const getScheduleBadge = (course: Course) => {
    if (course.status !== "SCHEDULED" || !course.scheduledAt) return null;

    const now = new Date();
    const isFuture = course.scheduledAt.getTime() > now.getTime();

    if (!isFuture) {
      return (
        <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-[2px] text-[11px] font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
          Started {formatDateTime(course.scheduledAt)}
        </span>
      );
    }

    if (course.showComingSoon) {
      return (
        <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-[2px] text-[11px] font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
          Coming soon {formatDateTime(course.scheduledAt)}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-[2px] text-[11px] font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
        Starts {formatDateTime(course.scheduledAt)}
      </span>
    );
  };

  const getEnrollmentBadge = (course: Course) => {
    const now = new Date();

    const windowNotStarted =
      course.enrollmentStartAt &&
      course.enrollmentStartAt.getTime() > now.getTime();
    const windowEnded =
      course.enrollmentEndAt &&
      course.enrollmentEndAt.getTime() < now.getTime();

    if (course.enrollmentStatus === "INVITE_ONLY") {
      return (
        <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-[2px] text-[11px] font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
          Invite only
        </span>
      );
    }

    if (course.enrollmentStatus === "PAUSED") {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-[2px] text-[11px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          Enrollment paused
        </span>
      );
    }

    if (course.enrollmentStatus === "CLOSED") {
      return (
        <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-[2px] text-[11px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
          Enrollment closed
        </span>
      );
    }

    // OPEN
    if (windowNotStarted) {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-[2px] text-[11px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          Enrollment not yet open
        </span>
      );
    }

    if (windowEnded) {
      return (
        <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-[2px] text-[11px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
          Enrollment ended
        </span>
      );
    }

    const displayedEnrollments = getDisplayedEnrollmentCount(course);
    const hasCapacityLimit =
      typeof course.maxStudents === "number" && course.maxStudents > 0;

    if (hasCapacityLimit && displayedEnrollments >= course.maxStudents!) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-[2px] text-[11px] font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
          Capacity full
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-[2px] text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
        Open for enrollment
      </span>
    );
  };

  const getStatusBadge = (status: CourseStatus) => {
    return (
      <span
        className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT
        )}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700 p-4">
        <div className="space-y-4">
          {/* Row 1: Search, Category, Type, Status, Visibility */}
          <div className="grid md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <SearchableDropdown
              options={[
                { value: "", label: "All Categories" },
                ...categories.map((cat) => ({
                  value: cat.id,
                  label: `${cat.icon || "📚"} ${cat.name}`,
                })),
              ]}
              value={filterCategory}
              onChange={setFilterCategory}
              placeholder="Filter by category"
            />

            <SearchableDropdown
              options={[
                { value: "", label: "All Types" },
                { value: "SINGLE", label: "📖 Single Course" },
                { value: "BUNDLE", label: "📦 Bundle" },
              ]}
              value={filterType}
              onChange={setFilterType}
              placeholder="Filter by type"
            />

            <SearchableDropdown
              options={[
                { value: "", label: "All Status" },
                ...COURSE_STATUS_OPTIONS,
              ]}
              value={filterStatus}
              onChange={setFilterStatus}
              placeholder="Filter by status"
            />

            <SearchableDropdown
              options={[
                { value: "", label: "All visibility" },
                { value: "PUBLIC", label: "Public" },
                { value: "UNLISTED", label: "Unlisted" },
                { value: "PRIVATE", label: "Private" },
                { value: "INTERNAL_ONLY", label: "Internal only" },
              ]}
              value={filterVisibility}
              onChange={setFilterVisibility}
              placeholder="Filter by visibility"
            />
          </div>

          {/* Row 2: Academic & Enrollment Filters */}
          <div className="grid md:grid-cols-5 gap-4">
            <SearchableDropdown
              options={[
                { value: "", label: "All Classes" },
                ...classes.map((cls) => ({
                  value: cls.id,
                  label: `${cls.name}${cls.alias ? ` (${cls.alias})` : ""}`,
                })),
              ]}
              value={filterClass}
              onChange={setFilterClass}
              placeholder="Filter by class"
            />

            <SearchableDropdown
              options={[
                { value: "", label: "All Subjects" },
                ...subjects.map((subject) => ({
                  value: subject.id,
                  label: `${subject.icon || "📚"} ${subject.name}`,
                })),
              ]}
              value={filterSubject}
              onChange={setFilterSubject}
              placeholder="Filter by subject"
            />

            <SearchableDropdown
              options={[
                { value: "", label: "All Streams" },
                ...streams.map((stream) => ({
                  value: stream.id,
                  label: stream.name,
                })),
              ]}
              value={filterStream}
              onChange={setFilterStream}
              placeholder="Filter by stream"
            />

            <SearchableDropdown
              options={[
                { value: "", label: "All enrollment" },
                { value: "OPEN", label: "Open" },
                { value: "PAUSED", label: "Paused" },
                { value: "CLOSED", label: "Closed" },
                { value: "INVITE_ONLY", label: "Invite only" },
              ]}
              value={filterEnrollmentStatus}
              onChange={setFilterEnrollmentStatus}
              placeholder="Filter by enrollment"
            />

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilterCategory("");
                  setFilterType("");
                  setFilterStatus("");
                  setFilterVisibility("");
                  setFilterEnrollmentStatus("");
                  setFilterClass("");
                  setFilterSubject("");
                  setFilterStream("");
                }}
                className="text-xs"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-card dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground dark:text-slate-400">
              Total Courses
            </p>
            <p className="text-2xl font-bold text-foreground dark:text-slate-200">
              {courses.length}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground dark:text-slate-400">
              Published
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {courses.filter((c) => c.status === "PUBLISHED").length}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground dark:text-slate-400">
              Drafts
            </p>
            <p className="text-2xl font-bold text-neutral-600 dark:text-neutral-400">
              {courses.filter((c) => c.status === "DRAFT").length}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground dark:text-slate-400">
              Total Enrollments (Displayed)
            </p>
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              {courses
                .reduce((sum, c) => sum + getDisplayedEnrollmentCount(c), 0)
                .toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div className="bg-card dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700">
        {/* List Header */}
        <div className="flex items-center justify-between p-4 border-b border-border dark:border-slate-700">
          <h2 className="text-lg font-semibold text-foreground dark:text-slate-200">
            All Courses ({filteredCourses.length})
          </h2>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex gap-1 border border-border dark:border-slate-600 rounded-lg p-1 bg-muted/30 dark:bg-slate-800/50">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className={
                  viewMode === "table"
                    ? undefined
                    : "text-muted-foreground dark:text-slate-400"
                }
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={
                  viewMode === "grid"
                    ? undefined
                    : "text-muted-foreground dark:text-slate-400"
                }
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>
            {/* Create Course Button */}
            <Link href="/course-management/courses/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </Link>
          </div>
        </div>

        {/* Courses Content */}
        <div className="p-4">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground dark:text-slate-500 mb-4" />
              <p className="text-muted-foreground dark:text-slate-400">
                {searchQuery ||
                filterCategory ||
                filterType ||
                filterStatus ||
                filterVisibility ||
                filterEnrollmentStatus ||
                filterClass ||
                filterSubject ||
                filterStream
                  ? "No courses found matching your filters"
                  : "No courses yet. Create your first course to get started!"}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="border border-border dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-lg dark:hover:shadow-violet-500/10 transition-all group bg-card dark:bg-slate-800/30"
                >
                  <div className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {course.courseType === "BUNDLE" ? (
                            <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          ) : (
                            <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                          )}
                          {course.isFeatured && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 px-2 py-0.5 rounded-full font-medium">
                              ⭐ Featured
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg line-clamp-2 text-foreground dark:text-slate-200">
                          {course.title}
                        </h3>
                      </div>
                      {getStatusBadge(course.status)}
                    </div>

                    {/* Category */}
                    {course.category && (
                      <div className="text-sm text-muted-foreground dark:text-slate-400">
                        {course.category.icon} {course.category.name}
                      </div>
                    )}

                    {/* Academic Badges */}
                    {(course.class || course.subject || course.stream) && (
                      <div className="flex flex-wrap gap-2">
                        {course.class && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-violet-100 to-violet-200 text-violet-700 dark:from-violet-900/40 dark:to-violet-800/40 dark:text-violet-300">
                            🎓 {course.class.name}
                          </span>
                        )}
                        {course.subject && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 dark:from-orange-900/40 dark:to-orange-800/40 dark:text-orange-300">
                            {course.subject.icon || "📚"} {course.subject.name}
                          </span>
                        )}
                        {course.stream && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 dark:from-blue-900/40 dark:to-blue-800/40 dark:text-blue-300">
                            🏛️ {course.stream.name}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex gap-4 text-sm text-muted-foreground dark:text-slate-400">
                      <span>
                        {course._count.topics.toLocaleString()} Topics
                      </span>
                      <span>
                        {getDisplayedEnrollmentCount(course).toLocaleString()}{" "}
                        Students
                      </span>
                    </div>

                    {/* Schedule / Enrollment badges */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {getScheduleBadge(course)}
                      {getEnrollmentBadge(course)}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Link
                        href={`/course-management/courses/${course.slug}`}
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Link
                        href={`/course-management/courses/${course.slug}/edit`}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      {course.status !== "PUBLISHED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="dark:border-emerald-500/60 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                          disabled={publishingCourseId === course.id}
                          onClick={() => handlePublish(course)}
                        >
                          <Rocket className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                        disabled={duplicatingCourseId === course.id}
                        onClick={() => handleDuplicate(course)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setCourseToDelete(course);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-border dark:border-slate-700 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50 dark:bg-slate-800/50">
                  <TableRow className="hover:bg-transparent dark:hover:bg-transparent border-border dark:border-slate-700">
                    <TableHead className="w-10 px-3">
                      <Checkbox
                        checked={someSelected ? "indeterminate" : allSelected}
                        onCheckedChange={(checked) => {
                          if (checked === true) {
                            setSelectedCourseIds(
                              filteredCourses.map((c) => c.id)
                            );
                          } else {
                            setSelectedCourseIds([]);
                          }
                        }}
                        aria-label="Select all courses"
                      />
                    </TableHead>
                    <TableHead className="min-w-[240px] font-semibold text-foreground dark:text-slate-200">
                      Title
                    </TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold text-foreground dark:text-slate-200">
                      Category
                    </TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold text-foreground dark:text-slate-200">
                      Academic
                    </TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-foreground dark:text-slate-200">
                      Type
                    </TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold text-foreground dark:text-slate-200">
                      Author
                    </TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold text-foreground dark:text-slate-200">
                      Price
                    </TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold text-foreground dark:text-slate-200">
                      Date
                    </TableHead>
                    <TableHead className="hidden sm:table-cell text-center font-semibold text-foreground dark:text-slate-200">
                      Enrollments
                    </TableHead>
                    <TableHead className="hidden xl:table-cell text-center font-semibold text-foreground dark:text-slate-200">
                      Engagement
                    </TableHead>
                    <TableHead className="hidden md:table-cell text-center font-semibold text-foreground dark:text-slate-200">
                      View Enrolled
                    </TableHead>
                    <TableHead className="font-semibold text-foreground dark:text-slate-200">
                      Status
                    </TableHead>
                    <TableHead className="text-right font-semibold text-foreground dark:text-slate-200">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => {
                    const authorName =
                      course.instructor?.name ?? course.authorName ?? "—";

                    const isFree =
                      course.paymentType === "FREE" ||
                      (!course.regularPrice && !course.offerPrice);

                    const effectivePrice =
                      course.offerPrice ?? course.regularPrice;

                    const enrollments = getDisplayedEnrollmentCount(course);

                    return (
                      <TableRow
                        key={course.id}
                        className="border-border dark:border-slate-700 hover:bg-muted/50 dark:hover:bg-slate-800/50"
                      >
                        <TableCell className="w-10 px-3 align-top">
                          <Checkbox
                            checked={selectedCourseIds.includes(course.id)}
                            onCheckedChange={(checked) => {
                              setSelectedCourseIds((prev) => {
                                if (checked) {
                                  if (prev.includes(course.id)) return prev;
                                  return [...prev, course.id];
                                }
                                return prev.filter((id) => id !== course.id);
                              });
                            }}
                            aria-label={`Select course ${course.title}`}
                          />
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex gap-3">
                            <div className="h-12 w-12 rounded-md overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 border border-border/60 dark:border-slate-700 flex items-center justify-center">
                              {(() => {
                                const imageUrl = getCourseDisplayImage(course);
                                if (imageUrl) {
                                  return (
                                    <Image
                                      src={imageUrl}
                                      alt={course.title}
                                      width={48}
                                      height={48}
                                      className="h-full w-full object-cover"
                                    />
                                  );
                                }
                                return (
                                  <div className="flex items-center justify-center h-full w-full text-xs text-muted-foreground dark:text-slate-400">
                                    {course.courseType === "BUNDLE" ? (
                                      <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                    ) : (
                                      <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/course-management/courses/${course.slug}`}
                                  className="font-medium text-foreground dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-300 truncate"
                                >
                                  {course.title}
                                </Link>
                                {course.isFeatured && (
                                  <span className="text-[10px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 px-2 py-[1px] rounded-full font-medium">
                                    ⭐ Featured
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground dark:text-slate-400 line-clamp-1">
                                {getCourseMetaLine(course)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell align-top">
                          {course.category ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm text-foreground dark:text-slate-300">
                                {course.category.icon} {course.category.name}
                              </span>
                              {course.class && (
                                <span className="text-[11px] text-muted-foreground dark:text-slate-500">
                                  {course.class.alias || course.class.name}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground dark:text-slate-500">
                              No category
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell align-top">
                          {course.class || course.subject || course.stream ? (
                            <div className="flex flex-wrap gap-1">
                              {course.class && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                                  {course.class.name}
                                </span>
                              )}
                              {course.subject && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                                  {course.subject.name}
                                </span>
                              )}
                              {course.stream && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                  {course.stream.name}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground dark:text-slate-500">
                              Public Course
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell align-top">
                          <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-100 px-2 py-[1px] text-xs font-medium">
                            {course.courseType === "BUNDLE"
                              ? "Bundle"
                              : "Single"}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell align-top">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[11px] font-semibold text-white flex items-center justify-center shadow-sm">
                              {authorName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <span className="text-sm text-foreground dark:text-slate-200 line-clamp-1">
                              {authorName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell align-top">
                          <div className="space-y-1 text-sm">
                            {isFree ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-[1px] text-xs font-medium">
                                Free
                              </span>
                            ) : effectivePrice != null ? (
                              <div className="flex items-baseline gap-1">
                                <span className="font-semibold text-foreground dark:text-slate-100">
                                  {course.currency}{" "}
                                  {effectivePrice.toLocaleString()}
                                </span>
                                {course.offerPrice &&
                                  course.regularPrice &&
                                  course.offerPrice < course.regularPrice && (
                                    <span className="text-[11px] text-muted-foreground line-through">
                                      {course.currency}{" "}
                                      {course.regularPrice.toLocaleString()}
                                    </span>
                                  )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                            {!isFree &&
                              course.paymentType === "SUBSCRIPTION" && (
                                <span className="inline-flex items-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 px-2 py-[1px] text-[10px] font-medium">
                                  Subscription
                                </span>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell align-top whitespace-nowrap text-sm text-muted-foreground dark:text-slate-400">
                          {formatDateTime(
                            course.publishedAt || course.createdAt
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell align-top text-center text-sm text-foreground dark:text-slate-200">
                          {enrollments.toLocaleString()}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell align-top text-center text-[11px] text-muted-foreground dark:text-slate-400">
                          <div className="flex flex-col items-center gap-1">
                            {getScheduleBadge(course)}
                            {getEnrollmentBadge(course)}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell align-top text-center">
                          <Button
                            variant="outline"
                            size="xs"
                            className="px-3 py-0 text-[11px] rounded-full border-dashed border-emerald-500/60 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/20"
                            onClick={() => {
                              toast.info(
                                "View enrolled students panel is coming soon."
                              );
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="min-w-[140px]">
                            <SearchableDropdown
                              options={COURSE_STATUS_OPTIONS}
                              value={course.status}
                              onChange={(value) => {
                                if (!value || value === course.status) return;
                                handleStatusChange(
                                  course,
                                  value as CourseStatus
                                );
                              }}
                              placeholder="Select status"
                              disabled={updatingStatusId === course.id}
                              className={cn(
                                "h-8 px-3 text-xs rounded-full border-none shadow-none",
                                STATUS_STYLES[course.status]
                              )}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right align-top">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-muted dark:hover:bg-slate-800"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/course-management/courses/${course.slug}`}
                                >
                                  <span className="flex items-center gap-2">
                                    <Eye className="h-3 w-3" />
                                    View
                                  </span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/course-management/courses/${course.slug}/edit`}
                                >
                                  <span className="flex items-center gap-2">
                                    <Edit className="h-3 w-3" />
                                    Edit
                                  </span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/course-management/courses/${course.slug}/builder`}
                                >
                                  <span className="flex items-center gap-2">
                                    <MonitorSmartphone className="h-3 w-3" />
                                    Edit curriculum
                                  </span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={duplicatingCourseId === course.id}
                                onClick={() => handleDuplicate(course)}
                              >
                                <Copy className="h-3 w-3 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              {course.status !== "PUBLISHED" && (
                                <DropdownMenuItem
                                  disabled={publishingCourseId === course.id}
                                  onClick={() => handlePublish(course)}
                                >
                                  <Rocket className="h-3 w-3 mr-2" />
                                  Publish
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  toast.info(
                                    "Course analytics dashboard is coming soon."
                                  );
                                }}
                              >
                                <BarChart3 className="h-3 w-3 mr-2" />
                                View analytics
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  toast.info(
                                    "Per-course device management is coming soon."
                                  );
                                }}
                              >
                                <MonitorSmartphone className="h-3 w-3 mr-2" />
                                Device management
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  try {
                                    const url =
                                      typeof window !== "undefined"
                                        ? `${window.location.origin}/course/${course.slug}`
                                        : `/course/${course.slug}`;
                                    navigator.clipboard
                                      .writeText(url)
                                      .then(() => {
                                        toast.success(
                                          "Course link copied to clipboard"
                                        );
                                      })
                                      .catch(() => {
                                        toast.error("Failed to copy link");
                                      });
                                  } catch {
                                    toast.error("Failed to copy link");
                                  }
                                }}
                              >
                                <Share2 className="h-3 w-3 mr-2" />
                                Share link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setCourseToDelete(course);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-slate-100">
              Delete Course
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-slate-400">
              Are you sure you want to delete &quot;{courseToDelete?.title}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:border-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
