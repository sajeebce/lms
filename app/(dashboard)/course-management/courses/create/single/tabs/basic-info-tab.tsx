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

type Subject = {
  id: string
  name: string
  code: string | null
  icon: string | null
}

type Class = {
  id: string
  name: string
  alias: string | null
  order: number
}

type Stream = {
  id: string
  name: string
}

type Props = {
  data: CourseFormData
  categories: Category[]
  subjects: Subject[]
  classes: Class[]
  streams: Stream[]
  onChange: (data: Partial<CourseFormData>) => void
}

export default function BasicInfoTab({ data, categories, subjects, classes, streams, onChange }: Props) {
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

      {/* Academic Integration Section */}
      <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-violet-50 to-orange-50 dark:from-violet-950/20 dark:to-orange-950/20 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-gradient-to-b from-violet-600 to-orange-500 rounded-full" />
          <div>
            <h3 className="font-semibold text-sm bg-gradient-to-r from-violet-600 to-orange-500 bg-clip-text text-transparent">
              Academic Integration (Optional)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Link this course to a specific class, subject, and stream for academic courses
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Class */}
          <div className="space-y-2">
            <Label htmlFor="class">Class / Grade</Label>
            <SearchableDropdown
              options={[
                { value: '', label: 'None (Public Course)' },
                ...classes.map((cls) => ({
                  value: cls.id,
                  label: `${cls.name}${cls.alias ? ` (${cls.alias})` : ''}`,
                })),
              ]}
              value={data.classId || ''}
              onChange={(value) => onChange({ classId: value || undefined })}
              placeholder="Select class"
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <SearchableDropdown
              options={[
                { value: '', label: 'None' },
                ...subjects.map((subject) => ({
                  value: subject.id,
                  label: `${subject.icon || '📚'} ${subject.name}`,
                })),
              ]}
              value={data.subjectId || ''}
              onChange={(value) => onChange({ subjectId: value || undefined })}
              placeholder="Select subject"
            />
          </div>

          {/* Stream */}
          <div className="space-y-2">
            <Label htmlFor="stream">Stream / Department</Label>
            <SearchableDropdown
              options={[
                { value: '', label: 'None (General)' },
                ...streams.map((stream) => ({
                  value: stream.id,
                  label: stream.name,
                })),
              ]}
              value={data.streamId || ''}
              onChange={(value) => onChange({ streamId: value || undefined })}
              placeholder="Select stream"
            />
          </div>
        </div>

        {/* Info Message */}
        {(data.classId || data.subjectId || data.streamId) && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <span className="text-blue-600 dark:text-blue-400 text-sm">ℹ️</span>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Academic Course:</strong> This course will be linked to{' '}
              {data.classId && classes.find((c) => c.id === data.classId)?.name}
              {data.subjectId && ` - ${subjects.find((s) => s.id === data.subjectId)?.name}`}
              {data.streamId && ` (${streams.find((s) => s.id === data.streamId)?.name})`}
              . Students enrolled in this class/stream will see this course.
            </p>
          </div>
        )}
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

