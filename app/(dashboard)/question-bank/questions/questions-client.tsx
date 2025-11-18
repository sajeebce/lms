"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Loader2,
  ChevronDown,
} from "lucide-react";
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
  deleteQuestion,
  getQuestionDetailsForPage,
} from "@/lib/actions/question.actions";

type Question = {
  id: string;
  questionText: string;
  questionType: string;
  difficulty: string;
  correctAnswer: string | null;
  topic: {
    name: string;
    chapter: {
      name: string;
      subject: { name: string };
      class: { name: string };
    };
  };
  source: { name: string } | null;
  institution: { name: string } | null;
  examYear: { year: number; label: string | null } | null;
};

type Props = {
  initialQuestions: Question[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  subjects: any[];
  classes: any[];
  chapters: any[];
  topics: any[];
  sources: any[];
  institutions: any[];
  examYears: any[];
};

const DIFFICULTY_COLORS = {
  EASY: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  MEDIUM:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  HARD: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  EXPERT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const TYPE_LABELS = {
  MCQ: "📝 MCQ",
  TRUE_FALSE: "✓✗ True/False",
  SHORT_ANSWER: "📄 Short Answer",
  LONG_ANSWER: "📋 Long Answer",
  FILL_BLANK: "⬜ Fill Blank",
  MATCHING: "🔗 Matching",
};

// Helper function to convert HTML to plain text preview
function getPlainPreview(html: string, maxLength = 140) {
  if (!html) return "";
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}
function RichHtmlBlock({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const images =
      container.querySelectorAll<HTMLImageElement>("img[data-border]");

    images.forEach((img) => {
      const border = img.getAttribute("data-border");
      if (!border || border === "none") {
        img.style.border = "none";
        return;
      }

      const color = img.getAttribute("data-border-color") || "#d1d5db";
      let width = "1px";
      if (border === "medium") {
        width = "2px";
      } else if (border === "thick") {
        width = "4px";
      }

      img.style.border = `${width} solid ${color}`;
    });
  }, [html]);

  return (
    <div
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

type ViewMode = "QUESTION" | "QUESTION_OPTIONS" | "FULL";

export default function QuestionsClient({
  initialQuestions,
  pagination,
  subjects,
  classes,
  chapters,
  topics,
  sources,
  institutions,
  examYears,
}: Props) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterChapter, setFilterChapter] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterInstitution, setFilterInstitution] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(
    null
  );
  const [viewMode, setViewMode] = useState<ViewMode>("QUESTION");
  const [detailsCache, setDetailsCache] = useState<
    Record<string, { options?: any[]; explanation?: string | null }>
  >({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Set<string>>(
    new Set()
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      !normalizedSearch ||
      getPlainPreview(q.questionText, 5000)
        .toLowerCase()
        .includes(normalizedSearch) ||
      (q.correctAnswer &&
        getPlainPreview(q.correctAnswer, 5000)
          .toLowerCase()
          .includes(normalizedSearch));

    const matchesSubject =
      !filterSubject || q.topic.chapter.subject.name === filterSubject;
    const matchesClass =
      !filterClass || q.topic.chapter.class.name === filterClass;
    const matchesChapter =
      !filterChapter || q.topic.chapter.name === filterChapter;
    const matchesTopic = !filterTopic || q.topic.name === filterTopic;
    const matchesDifficulty =
      !filterDifficulty || q.difficulty === filterDifficulty;
    const matchesType = !filterType || q.questionType === filterType;
    const matchesInstitution =
      !filterInstitution ||
      (q.institution && q.institution.name === filterInstitution);
    const matchesYear =
      !filterYear || (q.examYear && String(q.examYear.year) === filterYear);

    return (
      matchesSearch &&
      matchesSubject &&
      matchesClass &&
      matchesChapter &&
      matchesTopic &&
      matchesDifficulty &&
      matchesType &&
      matchesInstitution &&
      matchesYear
    );
  });

  // Lazy load options/explanations when view mode or expanded questions change
  useEffect(() => {
    const loadDetails = async () => {
      let idsToFetch: string[] = [];

      // When only specific questions are expanded in QUESTION mode
      if (viewMode === "QUESTION") {
        const expandedIds = Array.from(expandedQuestionIds);
        if (expandedIds.length === 0) return;

        idsToFetch = expandedIds.filter((id) => {
          const details = detailsCache[id];
          if (!details) return true;
          if (!details.options) return true;
          if (!("explanation" in details)) return true;
          return false;
        });

        if (idsToFetch.length === 0) return;

        setLoadingDetails(true);
        try {
          const result = await getQuestionDetailsForPage({
            questionIds: idsToFetch,
            includeExplanations: true,
          });

          if (result.success && result.details) {
            setDetailsCache((prev) => ({ ...prev, ...result.details }));
          }
        } catch (error) {
          console.error("Failed to load question details:", error);
          toast.error("Failed to load question details");
        } finally {
          setLoadingDetails(false);
        }

        return;
      }

      // For QUESTION_OPTIONS / FULL, work on the whole current page
      const questionIds = filteredQuestions.map((q) => q.id);

      if (viewMode === "QUESTION_OPTIONS") {
        idsToFetch = questionIds.filter((id) => !detailsCache[id]?.options);
      } else if (viewMode === "FULL") {
        idsToFetch = questionIds.filter((id) => {
          const details = detailsCache[id];
          if (!details) return true;
          if (!details.options) return true;
          if (!("explanation" in details)) return true;
          return false;
        });
      }

      if (idsToFetch.length === 0) return;

      setLoadingDetails(true);
      try {
        const result = await getQuestionDetailsForPage({
          questionIds: idsToFetch,
          includeExplanations: viewMode === "FULL",
        });

        if (result.success && result.details) {
          setDetailsCache((prev) => ({ ...prev, ...result.details }));
        }
      } catch (error) {
        console.error("Failed to load question details:", error);
        toast.error("Failed to load question details");
      } finally {
        setLoadingDetails(false);
      }
    };

    loadDetails();
  }, [viewMode, filteredQuestions, detailsCache, expandedQuestionIds]);

  const handleEdit = (question: Question) => {
    router.push(`/question-bank/questions/${question.id}/edit`);
  };

  const handleDelete = async () => {
    if (!questionToDelete) return;

    const result = await deleteQuestion(questionToDelete.id);

    if (result.success) {
      setQuestions(questions.filter((q) => q.id !== questionToDelete.id));
      toast.success("Question deleted successfully");
    } else {
      toast.error(result.error || "Failed to delete question");
    }

    setDeleteDialogOpen(false);
    setQuestionToDelete(null);
  };

  const getDifficultyBadge = (difficulty: string) => {
    const emoji =
      { EASY: "🟢", MEDIUM: "🟡", HARD: "🟠", EXPERT: "🔴" }[difficulty] ||
      "⚪";
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          DIFFICULTY_COLORS[difficulty as keyof typeof DIFFICULTY_COLORS] ||
          "bg-gray-100 text-gray-700"
        }`}
      >
        {emoji} {difficulty}
      </span>
    );
  };

  const toggleQuestionExpanded = (id: string) => {
    setExpandedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getTypeBadge = (type: string) => {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        {TYPE_LABELS[type as keyof typeof TYPE_LABELS] || type}
      </span>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Filters - Two Row Layout */}
      <div className="bg-card dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700 p-4">
        {/* Row 1: Search + Add Button */}
        <div className="flex gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
            />
          </div>
          <Button
            onClick={() => router.push("/question-bank/questions/new")}
            className="bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white font-medium whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Question</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Row 2: Filters Grid - always at least 2 rows on wide screens */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
          <SearchableDropdown
            options={[
              { value: "", label: "All Subjects" },
              ...subjects.map((s) => ({ value: s.name, label: s.name })),
            ]}
            value={filterSubject}
            onChange={setFilterSubject}
            placeholder="All Subjects"
          />

          <SearchableDropdown
            options={[
              { value: "", label: "All Classes" },
              ...classes.map((c) => ({ value: c.name, label: c.name })),
            ]}
            value={filterClass}
            onChange={setFilterClass}
            placeholder="All Classes"
          />

          <SearchableDropdown
            options={[
              { value: "", label: "All Chapters" },
              ...chapters.map((ch) => ({ value: ch.name, label: ch.name })),
            ]}
            value={filterChapter}
            onChange={setFilterChapter}
            placeholder="All Chapters"
          />

          <SearchableDropdown
            options={[
              { value: "", label: "All Topics" },
              ...topics.map((t) => ({ value: t.name, label: t.name })),
            ]}
            value={filterTopic}
            onChange={setFilterTopic}
            placeholder="All Topics"
          />

          <SearchableDropdown
            options={[
              { value: "", label: "All Difficulties" },
              { value: "EASY", label: "🟢 Easy" },
              { value: "MEDIUM", label: "🟡 Medium" },
              { value: "HARD", label: "🟠 Hard" },
              { value: "EXPERT", label: "🔴 Expert" },
            ]}
            value={filterDifficulty}
            onChange={setFilterDifficulty}
            placeholder="All Difficulties"
          />

          <SearchableDropdown
            options={[
              { value: "", label: "All Types" },
              { value: "MCQ", label: "📝 MCQ" },
              { value: "TRUE_FALSE", label: "✓✗ True/False" },
              { value: "SHORT_ANSWER", label: "📄 Short Answer" },
              { value: "LONG_ANSWER", label: "📋 Long Answer" },
            ]}
            value={filterType}
            onChange={setFilterType}
            placeholder="All Types"
          />

          <SearchableDropdown
            options={[
              { value: "", label: "All Institutions" },
              ...institutions.map((inst) => ({
                value: inst.name,
                label: inst.name,
              })),
            ]}
            value={filterInstitution}
            onChange={setFilterInstitution}
            placeholder="All Institutions"
          />

          <SearchableDropdown
            options={[
              { value: "", label: "All Years" },
              ...examYears.map((year) => ({
                value: String(year.year),
                label: year.label
                  ? `${year.year} – ${year.label}`
                  : String(year.year),
              })),
            ]}
            value={filterYear}
            onChange={setFilterYear}
            placeholder="All Years"
          />
        </div>
      </div>

      {/* Summary Bar */}
      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <div>
          Total{" "}
          <span className="font-semibold text-foreground">
            {pagination.total}
          </span>{" "}
          {pagination.total === 1 ? "question" : "questions"}
          {filteredQuestions.length !== pagination.total && (
            <span className="ml-2 text-xs">
              (showing {filteredQuestions.length} after filters)
            </span>
          )}
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 bg-card dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700 p-2">
        <span className="text-sm text-muted-foreground dark:text-slate-400 px-2">
          View:
        </span>
        <div className="flex gap-1">
          <Button
            variant={viewMode === "QUESTION" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("QUESTION")}
            className={
              viewMode === "QUESTION"
                ? "bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white font-medium"
                : ""
            }
          >
            Questions
          </Button>
          <Button
            variant={viewMode === "QUESTION_OPTIONS" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("QUESTION_OPTIONS")}
            className={
              viewMode === "QUESTION_OPTIONS"
                ? "bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white font-medium"
                : ""
            }
          >
            + Options
          </Button>
          <Button
            variant={viewMode === "FULL" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("FULL")}
            className={
              viewMode === "FULL"
                ? "bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white font-medium"
                : ""
            }
          >
            + Explanations
          </Button>
        </div>
        {loadingDetails && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground dark:text-slate-400 ml-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading details...
          </span>
        )}
      </div>

      {/* Questions Grid */}
      <div className="grid gap-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 border rounded-lg dark:border-slate-700 bg-card dark:bg-slate-800/30">
            <Package className="h-16 w-16 mx-auto text-muted-foreground dark:text-slate-500 mb-4" />
            <h3 className="text-lg font-medium mb-2 dark:text-slate-200">
              {searchQuery ||
              filterSubject ||
              filterClass ||
              filterDifficulty ||
              filterType ||
              filterInstitution ||
              filterYear
                ? "No questions found"
                : "No questions yet"}
            </h3>
            <p className="text-muted-foreground dark:text-slate-400 mb-4">
              {searchQuery ||
              filterSubject ||
              filterClass ||
              filterDifficulty ||
              filterType ||
              filterInstitution ||
              filterYear
                ? "Try adjusting your filters to find what you're looking for"
                : "Add your first question to get started!"}
            </p>
            {!searchQuery &&
              !filterSubject &&
              !filterClass &&
              !filterDifficulty &&
              !filterType &&
              !filterInstitution &&
              !filterYear && (
                <Button
                  onClick={() => router.push("/question-bank/questions/new")}
                  className="bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white font-medium"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              )}
          </div>
        ) : (
          filteredQuestions.map((question) => {
            const isExpanded = expandedQuestionIds.has(question.id);

            return (
              <div
                key={question.id}
                className="border dark:border-slate-700 rounded-lg p-4 md:p-5 hover:shadow-md transition-shadow bg-card dark:bg-slate-800/50"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Question Text */}
                    <p className="text-base font-medium text-foreground dark:text-slate-200 leading-relaxed line-clamp-2">
                      {getPlainPreview(question.questionText, 200)}
                    </p>

                    {/* Badges (clickable filters) */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800 cursor-pointer hover:shadow-sm"
                        onClick={() =>
                          setFilterSubject(question.topic.chapter.subject.name)
                        }
                      >
                        📚 {question.topic.chapter.subject.name}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800 cursor-pointer hover:shadow-sm"
                        onClick={() =>
                          setFilterClass(question.topic.chapter.class.name)
                        }
                      >
                        🎓 {question.topic.chapter.class.name}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800 cursor-pointer hover:shadow-sm"
                        onClick={() =>
                          setFilterChapter(question.topic.chapter.name)
                        }
                      >
                        📖 {question.topic.chapter.name}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800 cursor-pointer hover:shadow-sm"
                        onClick={() => setFilterTopic(question.topic.name)}
                      >
                        📝 {question.topic.name}
                      </Badge>
                      <span
                        className="cursor-pointer"
                        onClick={() => setFilterType(question.questionType)}
                      >
                        {getTypeBadge(question.questionType)}
                      </span>
                      <span
                        className="cursor-pointer"
                        onClick={() => setFilterDifficulty(question.difficulty)}
                      >
                        {getDifficultyBadge(question.difficulty)}
                      </span>
                      {question.institution && (
                        <Badge
                          variant="outline"
                          className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800 cursor-pointer hover:shadow-sm"
                          onClick={() =>
                            setFilterInstitution(question.institution!.name)
                          }
                        >
                          🏫 {question.institution.name}
                        </Badge>
                      )}
                      {question.examYear && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 cursor-pointer hover:shadow-sm"
                          onClick={() =>
                            setFilterYear(String(question.examYear!.year))
                          }
                        >
                          📅{" "}
                          {question.examYear.label
                            ? `${question.examYear.year} – ${question.examYear.label}`
                            : question.examYear.year}
                        </Badge>
                      )}
                    </div>

                    {/* Answer & Solution Toggle */}
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant={isExpanded ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleQuestionExpanded(question.id)}
                        className={
                          isExpanded
                            ? "inline-flex items-center gap-1 rounded-full bg-emerald-600/90 hover:bg-emerald-600 text-white px-3 py-1 text-xs font-medium shadow-sm"
                            : "inline-flex items-center gap-1 rounded-full border border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20 px-3 py-1 text-xs font-medium"
                        }
                      >
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                        {isExpanded
                          ? "Hide answer & solution"
                          : "Show answer & solution"}
                      </Button>
                    </div>

                    {/* MCQ Options (expanded or non-QUESTION views) */}
                    {(viewMode !== "QUESTION" || isExpanded) &&
                      question.questionType === "MCQ" &&
                      detailsCache[question.id]?.options && (
                        <div className="space-y-2 mt-4">
                          {detailsCache[question.id].options!.map(
                            (opt: any, idx: number) => (
                              <div
                                key={idx}
                                className={`rounded-lg p-3 border ${
                                  opt.isCorrect
                                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-start gap-2">
                                    <span
                                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium flex-shrink-0 ${
                                        opt.isCorrect
                                          ? "bg-emerald-600 text-white"
                                          : "bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200"
                                      }`}
                                    >
                                      {String.fromCharCode(65 + idx)}
                                    </span>
                                    <RichHtmlBlock
                                      html={opt.text}
                                      className="flex-1 ProseMirror prose prose-sm dark:prose-invert max-w-none break-words"
                                    />
                                  </div>
                                  {(viewMode === "FULL" || isExpanded) &&
                                    opt.explanation && (
                                      <div className="ml-8 pl-3 border-l-2 border-blue-400 dark:border-blue-600">
                                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                                          💡 Explanation:
                                        </p>
                                        <div className="ProseMirror prose prose-sm dark:prose-invert max-w-none text-sm break-words">
                                          <RichHtmlBlock
                                            html={opt.explanation}
                                          />
                                        </div>
                                      </div>
                                    )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                    {/* Non-MCQ Answer (expanded or non-QUESTION views) */}
                    {(viewMode !== "QUESTION" || isExpanded) &&
                      question.questionType !== "MCQ" &&
                      question.correctAnswer && (
                        <div className="mt-4 rounded-lg p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                          <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-2">
                            Answer:
                          </div>
                          <RichHtmlBlock
                            html={question.correctAnswer || ""}
                            className="ProseMirror prose prose-sm dark:prose-invert max-w-none break-words"
                          />
                        </div>
                      )}

                    {/* Explanation (FULL mode or expanded) */}
                    {(viewMode === "FULL" || isExpanded) &&
                      detailsCache[question.id]?.explanation && (
                        <div className="mt-4 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                          <div className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                            💡 Explanation
                          </div>
                          <RichHtmlBlock
                            html={detailsCache[question.id].explanation || ""}
                            className="ProseMirror prose prose-sm dark:prose-invert max-w-none max-h-64 overflow-auto"
                          />
                        </div>
                      )}
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2 md:self-start">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(question)}
                      className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setQuestionToDelete(question);
                        setDeleteDialogOpen(true);
                      }}
                      className="hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot
              be undone.
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
