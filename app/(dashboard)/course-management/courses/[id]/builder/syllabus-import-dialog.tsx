"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, BookOpen, GraduationCap, Layers } from "lucide-react";
import { importChaptersToCourse } from "@/lib/actions/course-syllabus-import.actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Chapter = Awaited<
  ReturnType<typeof import("@/lib/actions/chapter.actions").getChapters>
>[number];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  chapters: Chapter[];
  existingTopicTitles: string[];
  onCompleted?: () => void;
  courseClass?: { id: string; name: string } | null;
  courseStream?: { id: string; name: string } | null;
  courseSubject?: { id: string; name: string; icon: string | null } | null;
  preFilteredChapterIds?: string[]; // Optional: pre-filter to show only specific chapters
}

const STEPS = [
  { id: 1, name: "Confirm Scope", icon: GraduationCap },
  { id: 2, name: "Select Chapters", icon: BookOpen },
  { id: 3, name: "Preview & Generate", icon: Layers },
];

export default function SyllabusImportDialog({
  open,
  onOpenChange,
  courseId,
  chapters,
  existingTopicTitles,
  onCompleted,
  courseClass,
  courseStream,
  courseSubject,
  preFilteredChapterIds,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter chapters if pre-filtered IDs are provided
  const displayChapters = preFilteredChapterIds
    ? chapters.filter((ch) => preFilteredChapterIds.includes(ch.id))
    : chapters;

  const existingTitleSet = new Set(
    existingTopicTitles.map((t) => t.trim().toLowerCase())
  );

  // Auto-select non-duplicate chapters when dialog opens
  useEffect(() => {
    if (open && displayChapters.length > 0) {
      const titleSet = new Set(
        existingTopicTitles.map((t) => t.trim().toLowerCase())
      );
      const nonDuplicateIds = displayChapters
        .filter((ch) => !titleSet.has(ch.name.trim().toLowerCase()))
        .map((ch) => ch.id);
      setSelectedIds(nonDuplicateIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preFilteredChapterIds]);

  const toggleAll = () => {
    const selectableChapters = displayChapters.filter(
      (ch) => !existingTitleSet.has(ch.name.trim().toLowerCase())
    );
    if (selectedIds.length === selectableChapters.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableChapters.map((c) => c.id));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (currentStep === 2 && selectedIds.length === 0) {
      toast.error("Select at least one chapter to continue");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleImport = () => {
    if (!selectedIds.length) {
      toast.error("Select at least one chapter to import");
      return;
    }

    startTransition(async () => {
      const result = await importChaptersToCourse({
        courseId,
        chapterIds: selectedIds,
      });
      if (result.success) {
        toast.success(
          `🎉 Imported ${result.createdCount} chapter${
            result.createdCount === 1 ? "" : "s"
          } into this course`
        );
        setSelectedIds([]);
        setCurrentStep(1);
        onOpenChange(false);
        onCompleted?.();
      } else {
        toast.error(result.error || "Failed to import chapters");
      }
    });
  };

  const handleClose = () => {
    setCurrentStep(1);
    setSelectedIds([]);
    onOpenChange(false);
  };

  const selectedChapters = displayChapters.filter((ch) =>
    selectedIds.includes(ch.id)
  );
  const duplicateChapters = selectedChapters.filter((ch) =>
    existingTitleSet.has(ch.name.trim().toLowerCase())
  );
  const newChapters = selectedChapters.filter(
    (ch) => !existingTitleSet.has(ch.name.trim().toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            Import Chapters from Syllabus
          </DialogTitle>
        </DialogHeader>

        {displayChapters.length === 0 ? (
          <Alert className="border-border bg-secondary/60 text-foreground">
            <AlertTitle>No chapters available</AlertTitle>
            <AlertDescription>
              This subject/class does not have any active chapters in the
              syllabus yet. You can manage syllabus from the Academic Setup
              module.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Stepper */}
            <div className="flex items-center justify-between mb-6">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                          isCompleted
                            ? "bg-emerald-600 text-white"
                            : isActive
                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                            : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-slate-200"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <StepIcon className="h-5 w-5" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "mt-2 text-xs font-medium text-center",
                          isActive
                            ? "text-violet-600 dark:text-violet-400"
                            : isCompleted
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        )}
                      >
                        {step.name}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "flex-1 h-[2px] mx-2 transition-all",
                          isCompleted
                            ? "bg-emerald-600"
                            : "bg-gray-200 dark:bg-gray-700"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto">
              {currentStep === 1 && (
                <StepOne
                  courseClass={courseClass}
                  courseStream={courseStream}
                  courseSubject={courseSubject}
                />
              )}
              {currentStep === 2 && (
                <StepTwo
                  chapters={displayChapters}
                  selectedIds={selectedIds}
                  existingTitleSet={existingTitleSet}
                  toggleAll={toggleAll}
                  toggleOne={toggleOne}
                />
              )}
              {currentStep === 3 && (
                <StepThree
                  selectedChapters={newChapters}
                  duplicateChapters={duplicateChapters}
                />
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || isPending}
              >
                Back
              </Button>
              <div className="flex gap-2">
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isPending}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleImport}
                    disabled={isPending || newChapters.length === 0}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  >
                    {isPending
                      ? "Generating..."
                      : `Generate ${newChapters.length} Chapter${
                          newChapters.length === 1 ? "" : "s"
                        }`}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// STEP 1: CONFIRM SCOPE
// ============================================
function StepOne({
  courseClass,
  courseStream,
  courseSubject,
}: {
  courseClass?: { id: string; name: string } | null;
  courseStream?: { id: string; name: string } | null;
  courseSubject?: { id: string; name: string; icon: string | null } | null;
}) {
  return (
    <div className="space-y-4">
      <Alert className="border-violet-200 bg-violet-50 dark:bg-violet-950/20 dark:border-violet-800">
        <Sparkles className="h-4 w-4 text-violet-600" />
        <AlertTitle className="text-sm font-semibold text-violet-900 dark:text-violet-100">
          Import from Academic Syllabus
        </AlertTitle>
        <AlertDescription className="mt-1 text-xs text-violet-700 dark:text-violet-300">
          Questions and topics will be filtered using this scope in the Question
          Bank.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Current Scope</h3>
        <div className="flex flex-wrap gap-2">
          {courseClass && (
            <Badge
              variant="secondary"
              className="rounded-full px-3 py-1.5 text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            >
              <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
              Class: {courseClass.name}
            </Badge>
          )}
          {courseStream && (
            <Badge
              variant="secondary"
              className="rounded-full px-3 py-1.5 text-sm font-medium bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
            >
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              Stream: {courseStream.name}
            </Badge>
          )}
          {courseSubject && (
            <Badge
              variant="secondary"
              className="rounded-full px-3 py-1.5 text-sm font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            >
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              Subject: {courseSubject.name}
            </Badge>
          )}
        </div>

        {!courseClass && !courseStream && !courseSubject && (
          <p className="text-xs text-muted-foreground">
            No academic scope set for this course. You can still import
            chapters, but they won't be filtered by class/stream/subject.
          </p>
        )}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-secondary/40 border border-border">
        <h4 className="text-xs font-semibold text-foreground mb-2">
          What happens next?
        </h4>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-violet-600 dark:text-violet-400 mt-0.5">
              •
            </span>
            <span>Select chapters from the syllabus that match your scope</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-600 dark:text-violet-400 mt-0.5">
              •
            </span>
            <span>
              Preview which chapters will be created (duplicates will be
              skipped)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-600 dark:text-violet-400 mt-0.5">
              •
            </span>
            <span>
              Generate chapters with 0 lessons (you can add lessons later)
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// ============================================
// STEP 2: SELECT CHAPTERS
// ============================================
function StepTwo({
  chapters,
  selectedIds,
  existingTitleSet,
  toggleAll,
  toggleOne,
}: {
  chapters: Chapter[];
  selectedIds: string[];
  existingTitleSet: Set<string>;
  toggleAll: () => void;
  toggleOne: (id: string) => void;
}) {
  const selectableChapters = chapters.filter(
    (ch) => !existingTitleSet.has(ch.name.trim().toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Select Chapters
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose which chapters to import into this course
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleAll}>
            {selectedIds.length === selectableChapters.length
              ? "Clear all"
              : "Select all"}
          </Button>
          <Badge variant="secondary" className="rounded-full px-2 py-1 text-xs">
            {selectedIds.length} selected
          </Badge>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-secondary/60 sticky top-0 z-10">
              <tr className="border-b border-border">
                <th className="text-left p-3 font-semibold w-12">
                  <Checkbox
                    checked={
                      selectedIds.length === selectableChapters.length &&
                      selectableChapters.length > 0
                    }
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="text-left p-3 font-semibold">Chapter Name</th>
                <th className="text-center p-3 font-semibold w-24"># Topics</th>
                <th className="text-center p-3 font-semibold w-28">
                  # Questions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {chapters.map((chapter) => {
                const title = chapter.name.trim();
                const isExisting = existingTitleSet.has(title.toLowerCase());
                const checked = selectedIds.includes(chapter.id);
                const topicCount = chapter._count?.topics ?? 0;
                const questionCount = chapter._count?.questions ?? 0;

                return (
                  <tr
                    key={chapter.id}
                    className={cn(
                      "hover:bg-accent/40 transition-colors",
                      isExisting && "opacity-50 bg-secondary/20"
                    )}
                  >
                    <td className="p-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleOne(chapter.id)}
                        disabled={isExisting}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{title}</span>
                        {isExisting && (
                          <Badge
                            variant="secondary"
                            className="rounded-full text-[10px] px-2 py-[2px] bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          >
                            Already in course
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Badge
                        variant="outline"
                        className="rounded-full text-[10px] px-2 py-[2px]"
                      >
                        {topicCount}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge
                        variant="outline"
                        className="rounded-full text-[10px] px-2 py-[2px]"
                      >
                        {questionCount}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedIds.length === 0 && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTitle className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            No chapters selected
          </AlertTitle>
          <AlertDescription className="mt-1 text-xs text-amber-700 dark:text-amber-300">
            Please select at least one chapter to continue.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ============================================
// STEP 3: PREVIEW & GENERATE
// ============================================
function StepThree({
  selectedChapters,
  duplicateChapters,
}: {
  selectedChapters: Chapter[];
  duplicateChapters: Chapter[];
}) {
  return (
    <div className="space-y-4">
      <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800">
        <Check className="h-4 w-4 text-emerald-600" />
        <AlertTitle className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
          Ready to Generate
        </AlertTitle>
        <AlertDescription className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
          You are about to create {selectedChapters.length} chapter
          {selectedChapters.length === 1 ? "" : "s"} in this course.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Preview</h3>

        {selectedChapters.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">
              Will be created ({selectedChapters.length})
            </h4>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="max-h-[300px] overflow-y-auto">
                <div className="divide-y divide-border/60">
                  {selectedChapters.map((chapter) => {
                    const topicCount = chapter._count?.topics ?? 0;
                    const questionCount = chapter._count?.questions ?? 0;

                    return (
                      <div
                        key={chapter.id}
                        className="p-3 hover:bg-accent/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                              <span className="text-sm font-medium">
                                {chapter.name}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 ml-5">
                              Will create a chapter with 0 lessons / 0
                              activities
                            </p>
                          </div>
                          <div className="flex gap-1.5">
                            <Badge
                              variant="outline"
                              className="rounded-full text-[10px] px-2 py-[2px]"
                            >
                              {topicCount} topics
                            </Badge>
                            <Badge
                              variant="outline"
                              className="rounded-full text-[10px] px-2 py-[2px]"
                            >
                              {questionCount} questions
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {duplicateChapters.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">
              Will be skipped ({duplicateChapters.length})
            </h4>
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10 overflow-hidden">
              <div className="max-h-[150px] overflow-y-auto">
                <div className="divide-y divide-amber-200/60 dark:divide-amber-800/60">
                  {duplicateChapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="p-3 flex items-center gap-2"
                    >
                      <span className="text-xs text-amber-700 dark:text-amber-300">
                        {chapter.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className="rounded-full text-[10px] px-2 py-[2px] bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      >
                        Duplicate title
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedChapters.length === 0 && (
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
            <AlertTitle className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              All selected chapters already exist
            </AlertTitle>
            <AlertDescription className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              Go back and select different chapters, or continue with custom
              chapters.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
