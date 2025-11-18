'use client'

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
import { createExamBoard, updateExamBoard } from '@/lib/actions/exam-board.actions'

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  code: z.string().max(20, 'Code must be 20 characters or less').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

type FormData = z.infer<typeof formSchema>

type ExamBoard = Awaited<
  ReturnType<typeof import('@/lib/actions/exam-board.actions').getExamBoards>
>[number]

interface BoardFormProps {
  board?: ExamBoard | null
  onSuccess: (board: ExamBoard) => void
}

export default function BoardForm({ board, onSuccess }: BoardFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: board?.name || '',
      code: board?.code || '',
      status: (board?.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
    },
  })

  const onSubmit = async (data: FormData) => {
    const result = board
      ? await updateExamBoard(board.id, data)
      : await createExamBoard(data)

    if (result.success && result.data) {
      onSuccess(result.data as ExamBoard)
    } else {
      form.setError('root', {
        message: result.error || 'Failed to save institution',
      })
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
              <FormLabel>Institution / Board / College Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Adamjee College or Dhaka Board"
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
              <FormLabel>Short Code</FormLabel>
              <FormControl>
                <Input placeholder="e.g., DHA" maxLength={20} {...field} />
              </FormControl>
              <FormDescription>
                Optional code used in reports or filters (max 20 characters)
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
                    { value: 'ACTIVE', label: '✅ Active' },
                    { value: 'INACTIVE', label: '⏸️ Inactive' },
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

        {form.formState.errors.root && (
          <div className="text-sm text-red-600 dark:text-red-400">
            {form.formState.errors.root.message}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full"
          >
            {form.formState.isSubmitting
              ? 'Saving...'
              : board
              ? 'Update Institution'
              : 'Create Institution'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

