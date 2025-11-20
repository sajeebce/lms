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
  createCourseTopic,
  updateCourseTopic,
} from "@/lib/actions/course-topic.actions";
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
});

type FormValues = z.infer<typeof formSchema>;

interface ChapterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  editingChapter?: {
    id: string;
    title: string;
    description: string | null;
  } | null;
  onCompleted?: () => void;
}

export default function ChapterForm({
  open,
  onOpenChange,
  courseId,
  editingChapter,
  onCompleted,
}: ChapterFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!editingChapter;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  // Reset form when dialog opens/closes or editing chapter changes
  useEffect(() => {
    if (open && editingChapter) {
      form.reset({
        title: editingChapter.title,
        description: editingChapter.description || "",
      });
    } else if (open && !editingChapter) {
      form.reset({
        title: "",
        description: "",
      });
    }
  }, [open, editingChapter, form]);

  const handleSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateCourseTopic(editingChapter.id, values)
        : await createCourseTopic(courseId, values);

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit chapter" : "Create chapter"}
          </DialogTitle>
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
                  <FormLabel>Chapter title *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Motion and Kinematics"
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
                      placeholder="Optional short summary of this chapter"
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

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isPending || form.formState.isSubmitting}
                className="w-full"
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
