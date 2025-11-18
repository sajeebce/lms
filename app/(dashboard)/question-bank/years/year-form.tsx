'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import { toast } from 'sonner'
import { createExamYear, updateExamYear } from '@/lib/actions/exam-year.actions'

const formSchema = z
  .object({
    year: z
      .string()
      .min(1, 'Year is required')
      .max(4, 'Year must be 4 digits or less'),
    label: z
      .string()
      .max(100, 'Label must be 100 characters or less')
      .optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .superRefine((value, ctx) => {
    const num = Number.parseInt(value.year, 10)
    if (Number.isNaN(num)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['year'],
        message: 'Year must be a valid number',
      })
      return
    }
    if (num < 1900 || num > 2100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['year'],
        message: 'Year must be between 1900 and 2100',
      })
    }
  })

type FormData = z.infer<typeof formSchema>

type ExamYear = {
  id: string
  year: number
  label: string | null
  status: string
}

type Props = {
  initialData?: ExamYear | null
  onSuccess: (year: ExamYear) => void
}

export default function YearForm({ initialData, onSuccess }: Props) {
  const [saving, setSaving] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      year: initialData?.year?.toString() || '',
      label: initialData?.label || '',
      status: initialData?.status || 'ACTIVE',
    },
  })

  const onSubmit = async (data: FormData) => {
    setSaving(true)

    try {
      const payload = {
        year: Number.parseInt(data.year, 10),
        label: data.label || undefined,
        status: data.status,
      }

      const result = initialData
        ? await updateExamYear(initialData.id, payload)
        : await createExamYear(payload)

      if (result.success && result.data) {
        toast.success(
          initialData ? 'Exam year updated successfully' : 'Exam year created successfully'
        )
        onSuccess(result.data)
      } else {
        toast.error(result.error || 'Failed to save exam year')
      }
    } catch (error) {
      toast.error('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 2024"
                  min={1900}
                  max={2100}
                  {...field}
                />
              </FormControl>
              <FormDescription>Enter the exam year (190002100).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., 2024 Session, Autumn Term"
                  maxLength={100}
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional friendly label (max 100 characters).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {initialData && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <SearchableDropdown
                    options={[
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'INACTIVE', label: 'Inactive' },
                    ]}
                    value={field.value || 'ACTIVE'}
                    onChange={field.onChange}
                    placeholder="Select status"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white"
          >
            {saving ? 'Saving...' : initialData ? 'Update Year' : 'Create Year'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

