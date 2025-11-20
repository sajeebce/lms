"use client";

import { useTransition, useEffect } from "react";
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
import {
  createCourseLesson,
  updateCourseLesson,
} from "@/lib/actions/course-lesson.actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const formSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  lessonType: z.enum(["TEXT", "VIDEO_YOUTUBE", "DOCUMENT"]),
  videoUrl: z
    .string()
    .max(500, "Video URL must be 500 characters or less")
    .optional(),
  documentPath: z
    .string()
    .max(500, "Document path must be 500 characters or less")
    .optional(),
  textContent: z.string().optional(),
  duration: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        (!Number.isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 9999),
      "Duration must be between 0 and 9999 minutes"
    ),
});

type FormValues = z.infer<typeof formSchema>;

interface LessonFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: string | null;
  editingLesson?: {
    id: string;
    title: string;
    description: string | null;
    lessonType: string;
    videoUrl: string | null;
    documentPath: string | null;
    textContent: string | null;
    duration: number | null;
  } | null;
  onCompleted?: () => void;
}

export default function LessonForm({
  open,
  onOpenChange,
  topicId,
  editingLesson,
  onCompleted,
}: LessonFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!editingLesson;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      lessonType: "TEXT",
      videoUrl: "",
      documentPath: "",
      textContent: "",
      duration: "",
    },
  });

  // Reset form when dialog opens/closes or editing lesson changes
  useEffect(() => {
    if (open && editingLesson) {
      form.reset({
        title: editingLesson.title,
        description: editingLesson.description || "",
        lessonType: editingLesson.lessonType as any,
        videoUrl: editingLesson.videoUrl || "",
        documentPath: editingLesson.documentPath || "",
        textContent: editingLesson.textContent || "",
        duration: editingLesson.duration?.toString() || "",
      });
    } else if (open && !editingLesson) {
      form.reset({
        title: "",
        description: "",
        lessonType: "TEXT",
        videoUrl: "",
        documentPath: "",
        textContent: "",
        duration: "",
      });
    }
  }, [open, editingLesson, form]);

  const handleSubmit = (values: FormValues) => {
    if (!topicId && !isEditing) return;

    const numericDuration = values.duration
      ? Number(values.duration)
      : undefined;

    startTransition(async () => {
      const result = isEditing
        ? await updateCourseLesson(editingLesson.id, {
            ...values,
            duration: numericDuration,
          })
        : await createCourseLesson(topicId!, {
            ...values,
            duration: numericDuration,
          });

      if (result.success) {
        toast.success(
          isEditing
            ? "Lesson updated successfully"
            : "Lesson created successfully"
        );
        form.reset();
        onOpenChange(false);
        onCompleted?.();
      } else {
        toast.error(
          result.error || `Failed to ${isEditing ? "update" : "create"} lesson`
        );
      }
    });
  };

  const selectedType = form.watch("lessonType");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit lesson" : "Add lesson"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson title *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Introduction to Motion"
                      maxLength={100}
                    />
                  </FormControl>
                  <FormDescription>Max 100 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Optional short summary of this lesson"
                      maxLength={500}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Max 500 characters (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lessonType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson type *</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TEXT">Text</SelectItem>
                        <SelectItem value="VIDEO_YOUTUBE">
                          YouTube Video
                        </SelectItem>
                        <SelectItem value="DOCUMENT">
                          Document (PDF/DOC)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Choose how students will consume this lesson.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedType === "TEXT" && (
              <FormField
                control={form.control}
                name="textContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Text content *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Write the lesson content here"
                        rows={5}
                      />
                    </FormControl>
                    <FormDescription>
                      This text will be shown directly in the lesson player.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedType === "VIDEO_YOUTUBE" && (
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube URL *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://www.youtube.com/watch?v=..."
                        maxLength={500}
                      />
                    </FormControl>
                    <FormDescription>
                      Paste a valid YouTube video link.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedType === "DOCUMENT" && (
              <FormField
                control={form.control}
                name="documentPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document path *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Uploaded document path or URL"
                        maxLength={500}
                      />
                    </FormControl>
                    <FormDescription>
                      File upload integration will be wired here later.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., 30"
                      inputMode="numeric"
                      maxLength={4}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. Used for progress calculation. 09999 minutes.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isPending || form.formState.isSubmitting}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
              >
                {isPending || form.formState.isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Update lesson"
                  : "Create lesson"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
