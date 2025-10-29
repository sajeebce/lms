'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updateAcademicSettings } from './actions'

export function AcademicSettingsClient({ enableCohorts: initialValue }: { enableCohorts: boolean }) {
  const [enableCohorts, setEnableCohorts] = useState(initialValue)
  const [loading, setLoading] = useState(false)

  const handleToggle = async (value: boolean) => {
    setEnableCohorts(value)
    setLoading(true)

    const result = await updateAcademicSettings({ enableCohorts: value })

    setLoading(false)

    if (result.success) {
      toast.success(
        value ? 'Cohorts enabled' : 'Cohorts disabled',
        {
          description: value
            ? 'Students will be enrolled through cohorts'
            : 'Students will be enrolled directly without cohorts',
        }
      )
    } else {
      toast.error(result.error || 'Failed to update settings')
      setEnableCohorts(!value) // Revert on error
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enrollment Mode</CardTitle>
          <CardDescription>
            Choose how students are enrolled in your institution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cohorts Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Enable Cohorts</Label>
              <p className="text-sm text-muted-foreground">
                {enableCohorts
                  ? 'Students are enrolled through cohorts (Year → Class → Stream → Section → Cohort)'
                  : 'Students are enrolled directly (Year → Class → Stream → Section)'}
              </p>
            </div>
            <Switch
              checked={enableCohorts}
              onCheckedChange={handleToggle}
              disabled={loading}
            />
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              {enableCohorts ? 'Cohort Mode' : 'Direct Enrollment Mode'}
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              {enableCohorts ? (
                <>
                  <li>✓ Students are grouped into cohorts</li>
                  <li>✓ Each cohort has multiple sections</li>
                  <li>✓ Courses are enrolled through cohorts</li>
                  <li>✓ Better for structured batch-based systems</li>
                </>
              ) : (
                <>
                  <li>✓ Students are enrolled directly to sections</li>
                  <li>✓ No cohort layer required</li>
                  <li>✓ Courses are enrolled by year/class/section</li>
                  <li>✓ Better for flexible enrollment systems</li>
                </>
              )}
            </ul>
          </div>

          {/* Warning Box */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
              ⚠️ Important
            </h4>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Changing this setting will affect how new students are admitted and how courses are enrolled.
              Existing student enrollments will not be affected.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

