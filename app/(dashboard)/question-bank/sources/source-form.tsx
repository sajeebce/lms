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
import { Textarea } from '@/components/ui/textarea'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import { toast } from 'sonner'
import { createQuestionSource, updateQuestionSource } from '@/lib/actions/question-source.actions'

const baseSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  type: z.enum([
    'BOARD_EXAM',
    'TEXTBOOK',
    'REFERENCE_BOOK',
    'CUSTOM',
    'PREVIOUS_YEAR',
    'MOCK_TEST',
  ]),
  boardId: z.string().optional(),
  year: z.string().optional(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

const formSchema = baseSchema.superRefine((value, ctx) => {
  if (value.type === 'BOARD_EXAM') {
    if (!value.boardId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['boardId'],
        message: 'Board is required for board exam sources',
      })
    }
    if (!value.year || !value.year.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['year'],
        message: 'Year is required for board exam sources',
      })
    }
  }
})

type FormData = z.infer<typeof formSchema>

type Props = {
  initialData?: any
  boards: { id: string; name: string }[]
  onSuccess: (source: any) => void
  onCancel: () => void
}

export default function SourceForm({ initialData, boards, onSuccess, onCancel }: Props) {
  const [saving, setSaving] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'CUSTOM',
      boardId: initialData?.board?.id || '',
      year: initialData?.year?.toString() || '',
      description: initialData?.description || '',
      status: initialData?.status || 'ACTIVE',
    },
  })

  const onSubmit = async (data: FormData) => {
    setSaving(true)

    try {
      const payload = {
        name: data.name,
        type: data.type,
        boardId: data.boardId || undefined,
        year: data.year ? parseInt(data.year, 10) : undefined,
        description: data.description,
        status: data.status,
      }

      let result
      if (initialData) {
        result = await updateQuestionSource(initialData.id, payload)
      } else {
        result = await createQuestionSource(payload)
      }

      if (result.success && result.data) {
        toast.success(
          initialData
            ? 'Question source updated successfully'
            : 'Question source created successfully',
        )
        onSuccess(result.data)
      } else {
        toast.error(result.error || 'Failed to save question source')
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
        {/* Source Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., SSC 2023 Main Set"
                  maxLength={100}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter the source name (max 100 characters). Board/year are selected separately below.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Source Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source Type *</FormLabel>
              <FormControl>
                <SearchableDropdown
                  options={[
                    { value: 'BOARD_EXAM', label: '📘 Board Exam' },
                    { value: 'TEXTBOOK', label: '📗 Textbook' },
                    { value: 'REFERENCE_BOOK', label: '📙 Reference Book' },
                    { value: 'CUSTOM', label: '✏️ Custom' },
                    { value: 'PREVIOUS_YEAR', label: '📅 Previous Year' },
                    { value: 'MOCK_TEST', label: '🧪 Mock Test' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select source type"
                />
              </FormControl>
              <FormDescription>
                Select the type of question source.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Board */}
        <FormField
          control={form.control}
          name="boardId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Board {form.watch('type') === 'BOARD_EXAM' ? '*' : '(Optional)'}
              </FormLabel>
              <FormControl>
                <SearchableDropdown
                  options={[
                    { value: '', label: 'Select board' },
                    ...boards.map((board) => ({ value: board.id, label: board.name })),
                  ]}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Select board"
                />
              </FormControl>
              <FormDescription>
                Choose the exam board. Required for Board Exam sources.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Year */}
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Year {form.watch('type') === 'BOARD_EXAM' ? '*' : '(Optional)'}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 2023"
                  min={1900}
                  max={2100}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter the year (e.g., 2023). Required for Board Exam sources.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter description..."
                  maxLength={500}
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter a description (max 500 characters).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status (edit only) */}
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
            {saving
              ? 'Saving...'
              : initialData
              ? 'Update Source'
              : 'Create Source'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

