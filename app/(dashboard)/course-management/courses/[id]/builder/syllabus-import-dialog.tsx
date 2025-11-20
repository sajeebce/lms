"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { importChaptersToCourse } from "@/lib/actions/course-syllabus-import.actions";
import { toast } from "sonner";

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
}

export default function SyllabusImportDialog({
  open,
  onOpenChange,
  courseId,
  chapters,
  existingTopicTitles,
  onCompleted,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const existingTitleSet = new Set(
    existingTopicTitles.map((t) => t.trim().toLowerCase()),
  );

  const toggleAll = () => {
    if (selectedIds.length === chapters.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(chapters.map((c) => c.id));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
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
          `Imported ${result.createdCount} chapter${
            result.createdCount === 1 ? "" : "s"
          } into this course`,
        );
        setSelectedIds([]);
        onOpenChange(false);
        onCompleted?.();
      } else {
        toast.error(result.error || "Failed to import chapters");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import chapters from syllabus</DialogTitle>
        </DialogHeader>

        {chapters.length === 0 ? (
          <Alert className="border-border bg-secondary/60 text-foreground">
            <AlertTitle>No chapters available</AlertTitle>
            <AlertDescription>
              This subject/class does not have any active chapters in the syllabus
              yet. You can manage syllabus from the Academic Setup module.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert className="mb-3 border-border bg-secondary/60 text-foreground flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <div>
                <AlertTitle className="text-sm font-semibold">
                  One-click curriculum starter
                </AlertTitle>
                <AlertDescription className="mt-1 text-xs">
                  Selected chapters will be created as course chapters with 0
                  lessons. You can always rename, reorder, or add custom chapters
                  later.
                </AlertDescription>
              </div>
            </Alert>

            <div className="flex items-center justify-between mb-2 text-xs">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={toggleAll}
                >
                  {selectedIds.length === chapters.length
                    ? "Clear selection"
                    : "Select all"}
                </Button>
                <span className="text-muted-foreground">
                  {selectedIds.length} selected
                </span>
              </div>
            </div>

            <div className="h-72 rounded-md border border-border bg-card overflow-y-auto">
              <div className="divide-y divide-border/60">
                {chapters.map((chapter) => {
                  const title = chapter.name.trim();
                  const isExisting = existingTitleSet.has(title.toLowerCase());
                  const checked = selectedIds.includes(chapter.id);

                  return (
                    <label
                      key={chapter.id}
                      className="flex items-center gap-3 px-3 py-2 text-xs hover:bg-accent/40 cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleOne(chapter.id)}
                        disabled={isExisting}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {title}
                          </span>
                          {isExisting && (
                            <Badge variant="secondary" className="rounded-full text-[10px] px-2 py-[1px]">
                              Already in course
                            </Badge>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                          {chapter.subject && (
                            <Badge variant="secondary" className="rounded-full text-[10px] px-2 py-[1px]">
                              {chapter.subject.name}
                            </Badge>
                          )}
                          {chapter.class && (
                            <Badge variant="secondary" className="rounded-full text-[10px] px-2 py-[1px]">
                              Class: {chapter.class.name}
                            </Badge>
                          )}
                          {typeof chapter._count?.topics === "number" && (
                            <Badge variant="outline" className="rounded-full text-[10px] px-2 py-[1px]">
                              {chapter._count.topics} topics
                            </Badge>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button
                type="button"
                disabled={isPending}
                onClick={handleImport}
                className="w-full"
              >
                {isPending ? "Importing..." : "Import selected chapters"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

