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

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  type: z.enum(['BOARD_EXAM', 'TEXTBOOK', 'REFERENCE_BOOK', 'CUSTOM', 'PREVIOUS_YEAR', 'MOCK_TEST']),
  year: z.string().optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

type FormData = z.infer<typeof formSchema>

type Props = {
  initialData?: any
  onSuccess: (source: any) => void
  onCancel: () => void
}

export default function SourceForm({ initialData, onSuccess, onCancel }: Props) {
  const [saving, setSaving] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'CUSTOM',
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
        year: data.year ? parseInt(data.year) : undefined,
        description: data.description,
        status: data.status,
      }

      let result
      if (initialData) {
        result = await updateQuestionSource(initialData.id, payload)
      } else {
        result = await createQuestionSource(payload)
      }

      if (result.success) {
        toast.success(initialData ? 'Question source updated successfully' : 'Question source created successfully')
        
        // Refresh to get updated data
        window.location.reload()
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
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., SSC Board 2023" maxLength={100} {...field} />
              </FormControl>
              <FormDescription>Enter the name of the question source (max 100 characters)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
              <FormDescription>Select the type of question source</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 2023"
                  min={1900}
                  max={2100}
                  {...field}
                />
              </FormControl>
              <FormDescription>Enter the year (e.g., 2023)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
              <FormDescription>Enter a description (max 500 characters)</FormDescription>
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
            {saving ? 'Saving...' : initialData ? 'Update Source' : 'Create Source'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

