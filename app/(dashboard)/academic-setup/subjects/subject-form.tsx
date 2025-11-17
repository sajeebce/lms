"use client";

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

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  code: z.string().max(20, "Code must be 20 characters or less").optional(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  icon: z.string().max(50, "Icon must be 50 characters or less").optional(),
  color: z.string().max(20, "Color must be 20 characters or less").optional(),
  order: z.number().min(0).max(9999).optional(), // Changed from z.coerce.number() to z.number() (same as Chapter)
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

type FormData = z.infer<typeof formSchema>;

type SubjectFormProps = {
  initialData?: Partial<FormData>;
  suggestedOrder?: number;
  onSubmit: (data: FormData) => Promise<{
    success: boolean;
    fieldError?: string;
    error?: string;
  }>;
};

export default function SubjectForm({
  initialData,
  suggestedOrder,
  onSubmit,
}: SubjectFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      description: initialData?.description || "",
      icon: initialData?.icon || "",
      color: initialData?.color || "#6366f1",
      // For new subjects, prefill with suggestedOrder (next order in the list).
      // User can still clear it to let the backend auto-assign the order.
      order: initialData?.order ?? suggestedOrder ?? undefined,
      status: initialData?.status || "ACTIVE",
    },
  });

  const handleSubmit = async (data: FormData) => {
    // Clear previous order errors before submit
    form.clearErrors("order");

    const result = await onSubmit(data);

    if (!result?.success) {
      if (result?.fieldError) {
        form.setError("order", {
          type: "manual",
          message: result.fieldError,
        });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="dark:text-slate-200">
                  Subject Name *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Mathematics"
                    maxLength={100}
                    className="dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="dark:text-slate-400">
                  Max 100 characters
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Code */}
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="dark:text-slate-200">
                  Subject Code
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., MATH"
                    maxLength={20}
                    className="dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="dark:text-slate-400">
                  Optional short code (max 20 characters)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Icon */}
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="dark:text-slate-200">Icon</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., 📐 or calculator"
                    maxLength={50}
                    className="dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="dark:text-slate-400">
                  Emoji or icon name (max 50 characters)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Color */}
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="dark:text-slate-200">Color</FormLabel>
                <FormControl>
                  <Input
                    type="color"
                    className="dark:bg-slate-800 dark:border-slate-700 h-10"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="dark:text-slate-400">
                  Theme color for UI
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Order */}
          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="dark:text-slate-200">Order</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={9999}
                    className="dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
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
                <FormDescription className="dark:text-slate-400">
                  Display order (1-9999). Leave blank for auto ordering.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="dark:text-slate-200">Status</FormLabel>
                <FormControl>
                  <SearchableDropdown
                    options={[
                      { value: "ACTIVE", label: "Active" },
                      { value: "INACTIVE", label: "Inactive" },
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

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="dark:text-slate-200">Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter subject description..."
                  maxLength={500}
                  rows={3}
                  className="dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
                  {...field}
                />
              </FormControl>
              <FormDescription className="dark:text-slate-400">
                Max 500 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full"
          >
            {form.formState.isSubmitting
              ? "Saving..."
              : initialData
              ? "Update Subject"
              : "Create Subject"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
