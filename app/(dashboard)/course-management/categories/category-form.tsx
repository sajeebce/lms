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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEffect } from 'react'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be 100 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  icon: z.string().max(50, 'Icon must be 50 characters or less').optional(),
  color: z.string().max(20, 'Color must be 20 characters or less').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

type FormData = z.infer<typeof formSchema>

type Props = {
  initialData?: {
    name: string
    slug: string
    description: string | null
    icon: string | null
    color: string | null
    status: string
  } | null
  onSubmit: (data: FormData) => Promise<void>
  onCancel: () => void
}

// Predefined colors
const COLORS = [
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Teal', value: '#14b8a6' },
]

// Predefined icons (emojis)
const ICONS = ['📚', '🎓', '💻', '🔬', '🎨', '🎵', '⚽', '🌍', '📊', '🚀', '💡', '🏆']

export default function CategoryForm({ initialData, onSubmit, onCancel }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      description: initialData?.description || '',
      icon: initialData?.icon || '📚',
      color: initialData?.color || '#8b5cf6',
      status: (initialData?.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
    },
  })

  // Auto-generate slug from name
  useEffect(() => {
    if (!initialData) {
      const subscription = form.watch((value, { name: fieldName }) => {
        if (fieldName === 'name' && value.name) {
          const slug = value.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
          form.setValue('slug', slug)
        }
      })
      return () => subscription.unsubscribe()
    }
  }, [form, initialData])

  const handleSubmit = async (data: FormData) => {
    await onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Programming" maxLength={100} {...field} />
              </FormControl>
              <FormDescription>Enter the category name (max 100 characters)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Slug */}
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., programming" maxLength={100} {...field} />
              </FormControl>
              <FormDescription>
                URL-friendly identifier (auto-generated from name)
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter category description"
                  maxLength={500}
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional description (max 500 characters)</FormDescription>
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
              <FormLabel>Icon</FormLabel>
              <FormControl>
                <div className="flex gap-2 flex-wrap">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => field.onChange(icon)}
                      className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl transition-all ${
                        field.value === icon
                          ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-violet-400'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormDescription>Select an icon for the category</FormDescription>
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
              <FormLabel>Color</FormLabel>
              <FormControl>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => field.onChange(color.value)}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        field.value === color.value
                          ? 'border-neutral-900 dark:border-neutral-100 scale-110'
                          : 'border-neutral-200 dark:border-neutral-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </FormControl>
              <FormDescription>Select a color for the category</FormDescription>
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
              <FormLabel>Status *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Active categories are visible to users</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-700 hover:to-orange-600 text-white"
          >
            {form.formState.isSubmitting
              ? 'Saving...'
              : initialData
                ? 'Update Category'
                : 'Create Category'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

