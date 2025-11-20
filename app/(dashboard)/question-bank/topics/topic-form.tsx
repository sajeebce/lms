"use client";

import { useState, useEffect } from "react";
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
import { createTopic, updateTopic } from "@/lib/actions/topic.actions";

const formSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  classId: z.string().min(1, "Class is required"),
  chapterId: z.string().min(1, "Chapter is required"),
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
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type FormData = z.infer<typeof formSchema>;

type Topic = Awaited<
  ReturnType<typeof import("@/lib/actions/topic.actions").getTopics>
>[number];
type Chapter = Awaited<
  ReturnType<typeof import("@/lib/actions/chapter.actions").getChapters>
>[number];
type Subject = Awaited<
  ReturnType<typeof import("@/lib/actions/subject.actions").getSubjects>
>[number];
type Class = Awaited<
  ReturnType<typeof import("@/lib/actions/class.actions").getClasses>
>[number];

interface TopicFormProps {
  topic?: Topic | null;
  topics: Topic[];
  chapters: Chapter[];
  subjects: Subject[];
  classes: Class[];
  onSuccess: (topic: Topic) => void;
}

export default function TopicForm({
  topic,
  topics,
  chapters,
  subjects,
  classes,
  onSuccess,
}: TopicFormProps) {
  const [availableClasses, setAvailableClasses] = useState<Class[]>(classes);
  const [availableChapters, setAvailableChapters] =
    useState<Chapter[]>(chapters);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subjectId: topic?.chapter.subject.id || "",
      classId: topic?.chapter.class.id || "",
      chapterId: topic?.chapter.id || "",
      name: topic?.name || "",
      code: topic?.code || "",
      description: topic?.description || "",
      order: topic?.order,
      status: topic?.status || "ACTIVE",
    },
  });

  const selectedSubject = form.watch("subjectId");
  const selectedClass = form.watch("classId");
  const selectedChapter = form.watch("chapterId");

  // Auto-fill order for new topics based on existing topics in same chapter
  useEffect(() => {
    if (topic) return;
    if (!selectedChapter) return;

    const currentOrder = form.getValues("order");
    if (currentOrder !== undefined && currentOrder !== null) return;

    const maxOrder = topics
      .filter((t) => t.chapter.id === selectedChapter)
      .reduce((max, t) => (t.order > max ? t.order : max), 0);

    const nextOrder = maxOrder > 0 ? maxOrder + 1 : 1;
    form.setValue("order", nextOrder);
  }, [topic, selectedChapter, topics, form]);

  // Cascading filter: Update available classes when subject changes
  useEffect(() => {
    if (selectedSubject) {
      const filteredClasses = classes.filter((cls) =>
        chapters.some(
          (ch) => ch.subject.id === selectedSubject && ch.class.id === cls.id
        )
      );
      setAvailableClasses(filteredClasses);

      // Reset class and chapter if current selection is not in filtered list
      const currentClass = form.getValues("classId");
      if (
        currentClass &&
        !filteredClasses.some((cls) => cls.id === currentClass)
      ) {
        form.setValue("classId", "");
        form.setValue("chapterId", "");
      }
    } else {
      setAvailableClasses(classes);
    }
  }, [selectedSubject, chapters, classes, form]);

  // Cascading filter: Update available chapters when subject or class changes
  useEffect(() => {
    if (selectedSubject || selectedClass) {
      const filteredChapters = chapters.filter(
        (ch) =>
          (!selectedSubject || ch.subject.id === selectedSubject) &&
          (!selectedClass || ch.class.id === selectedClass)
      );
      setAvailableChapters(filteredChapters);

      // Reset chapter if current selection is not in filtered list
      const currentChapter = form.getValues("chapterId");
      if (
        currentChapter &&
        !filteredChapters.some((ch) => ch.id === currentChapter)
      ) {
        form.setValue("chapterId", "");
      }
    } else {
      setAvailableChapters(chapters);
    }
  }, [selectedSubject, selectedClass, chapters, form]);

  const onSubmit = async (data: FormData) => {
    const { subjectId, classId, ...topicData } = data;

    const result = topic
      ? await updateTopic(topic.id, topicData)
      : await createTopic(topicData);

    if (result.success && result.data) {
      onSuccess(result.data);
    } else {
      form.setError("root", {
        message: result.error || "An error occurred",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Subject, Class, Chapter - Cascading Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      label: subject.icon
                        ? `${subject.icon} ${subject.name}`
                        : subject.name,
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
                    options={availableClasses.map((cls) => ({
                      value: cls.id,
                      label: cls.name,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select class"
                    disabled={!selectedSubject}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="chapterId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chapter *</FormLabel>
                <FormControl>
                  <SearchableDropdown
                    options={availableChapters.map((chapter) => ({
                      value: chapter.id,
                      label: `${chapter.name} (${chapter.class.name})`,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select chapter"
                    disabled={!selectedSubject || !selectedClass}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Name and Code */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Topic Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter topic name"
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
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., T1, T2" maxLength={20} {...field} />
                </FormControl>
                <FormDescription>Max 20 characters (optional)</FormDescription>
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
                  placeholder="Enter topic description"
                  maxLength={500}
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>Max 500 characters (optional)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Order and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    value={field.value}
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

        {/* Actions */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full"
          >
            {form.formState.isSubmitting
              ? "Saving..."
              : topic
              ? "Update Topic"
              : "Create Topic"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
