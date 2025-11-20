"use client";

import { useTransition, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { Badge } from "@/components/ui/badge";
import { Link2, Plus } from "lucide-react";
import {
  createCourseTopic,
  updateCourseTopic,
} from "@/lib/actions/course-topic.actions";
import { toast } from "sonner";

const formSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  chapterId: z.string().optional(),
  topicId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type SyllabusChapter = {
  id: string;
  name: string;
  description: string | null;
  subject: { id: string; name: string; icon: string | null };
  class: { id: string; name: string };
  _count: { topics: number };
  topics: { _count: { questions: number } }[];
};

interface ChapterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  editingChapter?: {
    id: string;
    title: string;
    description: string | null;
  } | null;
  syllabusChapters?: SyllabusChapter[];
  hasAcademicContext?: boolean;
  onCompleted?: () => void;
}

export default function ChapterForm({
  open,
  onOpenChange,
  courseId,
  editingChapter,
  syllabusChapters = [],
  hasAcademicContext = false,
  onCompleted,
}: ChapterFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!editingChapter;
  const [creationMode, setCreationMode] = useState<"custom" | "syllabus">(
    "custom"
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      chapterId: "",
      topicId: "",
    },
  });

  // Reset form when dialog opens/closes or editing chapter changes
  useEffect(() => {
    if (open && editingChapter) {
      form.reset({
        title: editingChapter.title,
        description: editingChapter.description || "",
        chapterId: "",
        topicId: "",
      });
      setCreationMode("custom");
    } else if (open && !editingChapter) {
      form.reset({
        title: "",
        description: "",
        chapterId: "",
        topicId: "",
      });
      setCreationMode(hasAcademicContext ? "syllabus" : "custom");
    }
  }, [open, editingChapter, hasAcademicContext, form]);

  // When syllabus chapter is selected, auto-fill title and description
  const selectedChapterId = form.watch("chapterId");
  useEffect(() => {
    if (creationMode === "syllabus" && selectedChapterId) {
      const chapter = syllabusChapters.find(
        (ch) => ch.id === selectedChapterId
      );
      if (chapter) {
        form.setValue("title", chapter.name);
        form.setValue("description", chapter.description || "");
      }
    }
  }, [selectedChapterId, creationMode, syllabusChapters, form]);

  const handleSubmit = (values: FormValues) => {
    startTransition(async () => {
      // Prepare data based on creation mode
      const data: any = {
        title: values.title,
        description: values.description,
      };

      // If syllabus mode, include linking fields
      if (creationMode === "syllabus" && values.chapterId) {
        const selectedChapter = syllabusChapters.find(
          (ch) => ch.id === values.chapterId
        );
        if (selectedChapter) {
          data.subjectId = selectedChapter.subject.id;
          data.chapterId = values.chapterId;
          data.topicId = values.topicId || undefined;
          data.sourceType = "QUESTION_BANK";
        }
      }

      const result = isEditing
        ? await updateCourseTopic(editingChapter.id, data)
        : await createCourseTopic(courseId, data);

      if (result.success) {
        toast.success(
          isEditing
            ? "Chapter updated successfully"
            : "Chapter created successfully"
        );
        form.reset();
        onOpenChange(false);
        onCompleted?.();
      } else {
        toast.error(
          result.error || `Failed to ${isEditing ? "update" : "create"} chapter`
        );
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit chapter" : "Create chapter"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            {/* Creation Mode Selection (only for new chapters with academic context) */}
            {!isEditing &&
              hasAcademicContext &&
              syllabusChapters.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Creation Mode</Label>
                  <RadioGroup
                    value={creationMode}
                    onValueChange={(value: "custom" | "syllabus") =>
                      setCreationMode(value)
                    }
                    className="grid grid-cols-2 gap-3"
                  >
                    <div>
                      <RadioGroupItem
                        value="syllabus"
                        id="syllabus"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="syllabus"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-violet-600 peer-data-[state=checked]:bg-violet-50 dark:peer-data-[state=checked]:bg-violet-950/30 cursor-pointer transition-all"
                      >
                        <Link2 className="mb-2 h-6 w-6 text-violet-600 dark:text-violet-400" />
                        <div className="text-center">
                          <div className="font-semibold text-sm">
                            From Syllabus
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Link to existing chapter
                          </div>
                        </div>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="custom"
                        id="custom"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="custom"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-violet-600 peer-data-[state=checked]:bg-violet-50 dark:peer-data-[state=checked]:bg-violet-950/30 cursor-pointer transition-all"
                      >
                        <Plus className="mb-2 h-6 w-6 text-violet-600 dark:text-violet-400" />
                        <div className="text-center">
                          <div className="font-semibold text-sm">
                            Custom Chapter
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Create from scratch
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

            {/* Syllabus Chapter Selection */}
            {!isEditing && creationMode === "syllabus" && (
              <FormField
                control={form.control}
                name="chapterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Syllabus Chapter *</FormLabel>
                    <FormControl>
                      <SearchableDropdown
                        options={syllabusChapters.map((ch) => ({
                          value: ch.id,
                          label: `${ch.name} (${ch.class.name})`,
                        }))}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Search chapters..."
                      />
                    </FormControl>
                    <FormDescription>
                      Chapter name and description will be auto-filled
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Show selected chapter info */}
            {!isEditing &&
              creationMode === "syllabus" &&
              selectedChapterId &&
              syllabusChapters.find((ch) => ch.id === selectedChapterId) && (
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4">
                  <div className="flex items-start gap-3">
                    <Link2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                        Linked to Syllabus
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                        This chapter will be linked to the question bank
                        hierarchy. Questions and topics can be filtered
                        automatically.
                      </p>
                      <div className="flex gap-2 mt-2">
                        {(() => {
                          const ch = syllabusChapters.find(
                            (c) => c.id === selectedChapterId
                          );
                          return (
                            <>
                              <Badge
                                variant="outline"
                                className="text-xs bg-white dark:bg-slate-800"
                              >
                                {ch?.subject.icon} {ch?.subject.name}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-xs bg-white dark:bg-slate-800"
                              >
                                {ch?._count.topics} topics
                              </Badge>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chapter title *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Motion and Kinematics"
                      maxLength={200}
                      disabled={
                        !isEditing &&
                        creationMode === "syllabus" &&
                        !!selectedChapterId
                      }
                    />
                  </FormControl>
                  <FormDescription>Max 200 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Optional short summary of this chapter"
                      maxLength={500}
                      rows={3}
                      disabled={
                        !isEditing &&
                        creationMode === "syllabus" &&
                        !!selectedChapterId
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Max 500 characters (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isPending || form.formState.isSubmitting}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
              >
                {isPending || form.formState.isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Update chapter"
                  : "Create chapter"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
