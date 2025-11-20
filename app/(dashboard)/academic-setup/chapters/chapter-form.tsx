"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { createChapter, updateChapter } from "@/lib/actions/chapter.actions";

const formSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  classId: z.string().min(1, "Class is required"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  code: z.string().max(20, "Code must be 20 characters or less").optional(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  order: z
    .number()
    .min(1, "Order must be between 1 and 9999")
    .max(9999, "Order must be between 1 and 9999")
    .optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

type FormData = z.infer<typeof formSchema>;

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

type Chapter = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  order: number;
  status: "ACTIVE" | "INACTIVE";
  subject: {
    id: string;
    name: string;
    icon: string | null;
  };
  class: {
    id: string;
    name: string;
    alias: string | null;
  };
};

type Props = {
  chapter: Chapter | null;
  subjects: Subject[];
  classes: Class[];
  chapters: Chapter[];
  onSuccess: (chapter: any) => void;
  onCancel: () => void;
};

export default function ChapterForm({
  chapter,
  subjects,
  classes,
  chapters,
  onSuccess,
  onCancel,
}: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subjectId: chapter?.subject.id || "",
      classId: chapter?.class.id || "",
      name: chapter?.name || "",
      code: chapter?.code || "",
      description: chapter?.description || "",
      order: chapter?.order,
      status: chapter?.status || "ACTIVE",
    },
  });

  const selectedSubjectId = form.watch("subjectId");
  const selectedClassId = form.watch("classId");

  // Auto-fill order for new chapters based on existing chapters in same subject + class
  useEffect(() => {
    if (chapter) return;
    if (!selectedSubjectId || !selectedClassId) return;

    const currentOrder = form.getValues("order");
    if (currentOrder !== undefined && currentOrder !== null) return;

    const maxOrder = chapters
      .filter(
        (c) =>
          c.subject.id === selectedSubjectId && c.class.id === selectedClassId
      )
      .reduce((max, c) => (c.order > max ? c.order : max), 0);

    const nextOrder = maxOrder > 0 ? maxOrder + 1 : 1;
    form.setValue("order", nextOrder);
  }, [chapter, selectedSubjectId, selectedClassId, chapters, form]);

  const onSubmit = async (data: FormData) => {
    // Clear previous order errors before submit
    form.clearErrors("order");

    const result = chapter
      ? await updateChapter(chapter.id, data)
      : await createChapter(data);

    if (result.success) {
      onSuccess(result.data);
    } else {
      // Check if it's an order duplicate error
      if (result.error?.includes("already used for another chapter")) {
        form.setError("order", {
          type: "manual",
          message: result.error,
        });
      } else {
        form.setError("root", {
          message: result.error || "An error occurred",
        });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Subject & Class */}
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="subjectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject *</FormLabel>
                <FormControl>
                  <SearchableDropdown
                    options={subjects.map((subject) => ({
                      value: subject.id,
                      label: `${subject.icon || "📚"} ${subject.name}`,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select subject"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="classId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class *</FormLabel>
                <FormControl>
                  <SearchableDropdown
                    options={classes.map((cls) => ({
                      value: cls.id,
                      label: `${cls.name}${cls.alias ? ` (${cls.alias})` : ""}`,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select class"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Name & Code */}
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chapter Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Introduction to Algebra"
                    maxLength={100}
                    {...field}
                  />
                </FormControl>
                <FormDescription>Max 100 characters</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chapter Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., CH01" maxLength={20} {...field} />
                </FormControl>
                <FormDescription>Max 20 characters</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of the chapter"
                  maxLength={500}
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>Max 500 characters</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Order & Status */}
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={9999}
                    placeholder="1"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        field.onChange(undefined);
                        return;
                      }
                      const parsed = parseInt(value, 10);
                      field.onChange(Number.isNaN(parsed) ? undefined : parsed);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Leave blank for auto ordering (1-9999)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <SearchableDropdown
                    options={[
                      { value: "ACTIVE", label: "✅ Active" },
                      { value: "INACTIVE", label: "⏸️ Inactive" },
                    ]}
                    value={field.value || "ACTIVE"}
                    onChange={field.onChange}
                    placeholder="Select status"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Error Message */}
        {form.formState.errors.root && (
          <div className="text-sm text-red-600 dark:text-red-400">
            {form.formState.errors.root.message}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
            className="dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:border-slate-600"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Saving..."
              : chapter
              ? "Update Chapter"
              : "Create Chapter"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
