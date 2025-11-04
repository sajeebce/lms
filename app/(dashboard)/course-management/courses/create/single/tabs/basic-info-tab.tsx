'use client'

import { useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import type { CourseFormData } from '../single-course-form'

type Category = {
  id: string
  name: string
  slug: string
  icon: string | null
  color: string | null
}

type Props = {
  data: CourseFormData
  categories: Category[]
  onChange: (data: Partial<CourseFormData>) => void
}

export default function BasicInfoTab({ data, categories, onChange }: Props) {
  // Auto-generate slug from title
  useEffect(() => {
    if (data.title && !data.slug) {
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      onChange({ slug })
    }
  }, [data.title, data.slug, onChange])

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Course Title *</Label>
          <Input
            id="title"
            placeholder="e.g., Introduction to Programming"
            value={data.title}
            onChange={(e) => onChange({ title: e.target.value })}
            maxLength={200}
          />
          <p className="text-xs text-neutral-500">Max 200 characters</p>
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug">URL Slug *</Label>
          <Input
            id="slug"
            placeholder="e.g., intro-to-programming"
            value={data.slug}
            onChange={(e) => onChange({ slug: e.target.value })}
            maxLength={200}
          />
          <p className="text-xs text-neutral-500">Auto-generated from title</p>
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <SearchableDropdown
          options={categories.map((cat) => ({
            value: cat.id,
            label: `${cat.icon || '📚'} ${cat.name}`,
          }))}
          value={data.categoryId || ''}
          onChange={(value) => onChange({ categoryId: value })}
          placeholder="Select category (optional)"
        />
      </div>

      {/* Short Description */}
      <div className="space-y-2">
        <Label htmlFor="shortDescription">Short Description</Label>
        <Textarea
          id="shortDescription"
          placeholder="Brief overview of the course (shown in course cards)"
          value={data.shortDescription || ''}
          onChange={(e) => onChange({ shortDescription: e.target.value })}
          maxLength={500}
          rows={3}
        />
        <p className="text-xs text-neutral-500">Max 500 characters</p>
      </div>

      {/* Full Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Full Description</Label>
        <Textarea
          id="description"
          placeholder="Detailed course description (supports markdown)"
          value={data.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={8}
        />
        <p className="text-xs text-neutral-500">Supports markdown formatting</p>
      </div>
    </div>
  )
}

