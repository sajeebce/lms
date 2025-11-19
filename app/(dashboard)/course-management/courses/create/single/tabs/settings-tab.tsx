'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import type { CourseFormData } from '../single-course-form'

type Props = {
  data: CourseFormData
  onChange: (data: Partial<CourseFormData>) => void
}

export default function SettingsTab({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="space-y-2">
        <Label>Course Status *</Label>
        <SearchableDropdown
          options={[
            { value: 'DRAFT', label: '📝 Draft (Not visible to students)' },
            { value: 'PUBLISHED', label: '✅ Published (Visible to all)' },
            { value: 'SCHEDULED', label: '⏰ Scheduled (Publish later)' },
            { value: 'PRIVATE', label: '🔒 Private (Invite only)' },
          ]}
          value={data.status}
          onChange={(value) => {
            if (!value) return
            onChange({ status: value as CourseFormData['status'] })
          }}
          placeholder="Select status"
        />
      </div>

      {/* Feature Toggles */}
      <div className="space-y-4">
        {/* Featured Course */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label>Featured Course</Label>
            <p className="text-sm text-neutral-500">
              Show this course in featured section on homepage
            </p>
          </div>
          <Switch
            checked={data.isFeatured}
            onCheckedChange={(checked) => onChange({ isFeatured: checked })}
          />
        </div>

        {/* Allow Comments */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label>Allow Comments</Label>
            <p className="text-sm text-neutral-500">
              Students can comment on lessons and topics
            </p>
          </div>
          <Switch
            checked={data.allowComments}
            onCheckedChange={(checked) => onChange({ allowComments: checked })}
          />
        </div>

        {/* Certificate Enabled */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label>Certificate Enabled</Label>
            <p className="text-sm text-neutral-500">
              Issue certificate upon course completion
            </p>
          </div>
          <Switch
            checked={data.certificateEnabled}
            onCheckedChange={(checked) => onChange({ certificateEnabled: checked })}
          />
        </div>
      </div>

      {/* Info Card */}
      <div className="border rounded-lg p-4 space-y-2 bg-violet-50 dark:bg-violet-950/20">
        <h3 className="font-medium text-violet-600 dark:text-violet-400">Course Visibility</h3>
        <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
          <li>• <strong>Draft:</strong> Only visible to admins/instructors</li>
          <li>• <strong>Published:</strong> Visible to all students (can enroll)</li>
          <li>• <strong>Scheduled:</strong> Will be published at scheduled date</li>
          <li>• <strong>Private:</strong> Only accessible via direct invite link</li>
        </ul>
      </div>
    </div>
  )
}

