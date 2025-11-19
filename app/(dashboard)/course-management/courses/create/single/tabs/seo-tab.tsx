'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Search } from 'lucide-react'
import type { CourseFormData } from '../single-course-form'

type Props = {
  data: CourseFormData
  onChange: (data: Partial<CourseFormData>) => void
}

export default function SeoTab({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      {/* Meta Title */}
      <div className="space-y-2">
        <Label htmlFor="metaTitle">Meta Title</Label>
        <Input
          id="metaTitle"
          placeholder="e.g., Learn Programming - Complete Beginner Course"
          value={data.metaTitle || ''}
          onChange={(e) => onChange({ metaTitle: e.target.value })}
          maxLength={200}
        />
        <p className="text-xs text-neutral-500">
          Max 60 characters recommended for Google search results
        </p>
      </div>

      {/* Meta Description */}
      <div className="space-y-2">
        <Label htmlFor="metaDescription">Meta Description</Label>
        <Textarea
          id="metaDescription"
          placeholder="Brief description for search engines (shown in Google search results)"
          value={data.metaDescription || ''}
          onChange={(e) => onChange({ metaDescription: e.target.value })}
          maxLength={500}
          rows={4}
        />
        <p className="text-xs text-neutral-500">
          Max 160 characters recommended for Google search results
        </p>
      </div>

      {/* Meta Keywords */}
      <div className="space-y-2">
        <Label htmlFor="metaKeywords">Meta Keywords</Label>
        <Input
          id="metaKeywords"
          placeholder="e.g., programming, coding, beginner, tutorial"
          value={data.metaKeywords || ''}
          onChange={(e) => onChange({ metaKeywords: e.target.value })}
          maxLength={500}
        />
        <p className="text-xs text-neutral-500">
          Comma-separated keywords (optional, not heavily used by modern search engines)
        </p>
      </div>

      {/* Fake Enrollment Count */}
      <div className="space-y-2">
        <Label htmlFor="fakeEnrollmentCount">Fake Enrollment Count (Optional)</Label>
        <Input
          id="fakeEnrollmentCount"
          type="number"
          placeholder="e.g., 250"
          value={data.fakeEnrollmentCount ?? ''}
          onChange={(e) => {
            const value = e.target.value
            onChange({
              fakeEnrollmentCount:
                value === '' ? undefined : Number.parseInt(value, 10),
            })
          }}
          min={0}
          max={9999}
        />
        <p className="text-xs text-neutral-500">
          Optional social proof shown as students enrolled on public course cards. Leave empty to use real enrollments.
        </p>
      </div>

      {/* SEO Preview */}
      <div className="border rounded-lg p-4 space-y-2 bg-neutral-50 dark:bg-neutral-900">
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
          <Search className="h-4 w-4" />
          Google Search Preview
        </div>
        <div className="space-y-1">
          <div className="text-blue-600 dark:text-blue-400 text-lg">
            {data.metaTitle || data.title || 'Course Title'}
          </div>
          <div className="text-green-700 dark:text-green-500 text-xs">
            https://yourdomain.com/courses/{data.slug || 'course-slug'}
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {data.metaDescription || data.shortDescription || 'Course description will appear here...'}
          </div>
        </div>
      </div>

      {/* SEO Tips */}
      <div className="border rounded-lg p-4 space-y-2">
        <h3 className="font-medium text-violet-600 dark:text-violet-400">SEO Best Practices</h3>
        <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
          <li>• Use descriptive, keyword-rich titles (50-60 characters)</li>
          <li>• Write compelling meta descriptions (150-160 characters)</li>
          <li>• Include target keywords naturally</li>
          <li>• Make URLs short and readable (slug)</li>
          <li>• Use unique meta data for each course</li>
        </ul>
      </div>
    </div>
  )
}

