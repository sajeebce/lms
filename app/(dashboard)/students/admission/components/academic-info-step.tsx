'use client'

import { UseFormReturn } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import { GraduationCap } from 'lucide-react'
import { useState, useEffect } from 'react'

type Branch = { id: string; name: string }
type AcademicYear = { id: string; name: string; code: string }
type Class = { id: string; name: string }
type Cohort = { id: string; name: string }
type Section = { id: string; name: string; capacity: number; _count: { enrollments: number } }

export function AcademicInfoStep({
  form,
  branches,
  academicYears,
  classes,
  enableCohorts,
  onFetchCohorts,
  onFetchSections,
}: {
  form: UseFormReturn<any>
  branches: Branch[]
  academicYears: AcademicYear[]
  classes: Class[]
  enableCohorts: boolean
  onFetchCohorts: (yearId: string, classId: string, branchId: string) => Promise<Cohort[]>
  onFetchSections: (cohortId?: string, classId?: string) => Promise<Section[]>
}) {
  const [availableCohorts, setAvailableCohorts] = useState<Cohort[]>([])
  const [availableSections, setAvailableSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(false)

  const handleYearChange = async (yearId: string) => {
    form.setValue('cohortId', '')
    form.setValue('sectionId', '')
    setAvailableCohorts([])
    setAvailableSections([])
    
    if (enableCohorts) {
      await fetchCohortsIfReady()
    }
  }

  const handleClassChange = async (classId: string) => {
    form.setValue('cohortId', '')
    form.setValue('sectionId', '')
    setAvailableCohorts([])
    setAvailableSections([])
    
    if (enableCohorts) {
      await fetchCohortsIfReady()
    } else {
      // Fetch sections directly for this class
      setLoading(true)
      const sections = await onFetchSections(undefined, classId)
      setAvailableSections(sections)
      setLoading(false)
    }
  }

  const handleBranchChange = async (branchId: string) => {
    form.setValue('cohortId', '')
    form.setValue('sectionId', '')
    setAvailableCohorts([])
    setAvailableSections([])
    
    await fetchCohortsIfReady()
  }

  const fetchCohortsIfReady = async () => {
    const yearId = form.getValues('academicYearId')
    const classId = form.getValues('classId')
    const branchId = form.getValues('branchId')

    if (yearId && classId && branchId) {
      setLoading(true)
      const cohorts = await onFetchCohorts(yearId, classId, branchId)
      setAvailableCohorts(cohorts)
      setLoading(false)
    }
  }

  const handleCohortChange = async (cohortId: string) => {
    form.setValue('sectionId', '')
    setLoading(true)
    const sections = await onFetchSections(cohortId)
    setAvailableSections(sections)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
          <GraduationCap className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Academic Information</h3>
          <p className="text-sm text-muted-foreground">Select class, section and academic year</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {enableCohorts && branches.length > 1 && (
          <FormField
            control={form.control}
            name="branchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branch *</FormLabel>
                <FormControl>
                  <SearchableDropdown
                    options={branches.map((branch) => ({
                      value: branch.id,
                      label: branch.name,
                    }))}
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value)
                      handleBranchChange(value)
                    }}
                    placeholder="Select branch"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="academicYearId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Academic Year *</FormLabel>
              <FormControl>
                <SearchableDropdown
                  options={academicYears.map((year) => ({
                    value: year.id,
                    label: `${year.name} (${year.code})`,
                  }))}
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value)
                    handleYearChange(value)
                  }}
                  placeholder="Select academic year"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="classId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class *</FormLabel>
              <FormControl>
                <SearchableDropdown
                  options={classes.map((cls) => ({
                    value: cls.id,
                    label: cls.name,
                  }))}
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value)
                    handleClassChange(value)
                  }}
                  placeholder="Select class"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {enableCohorts && (
          <FormField
            control={form.control}
            name="cohortId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cohort *</FormLabel>
                <FormControl>
                  <SearchableDropdown
                    options={availableCohorts.map((cohort) => ({
                      value: cohort.id,
                      label: cohort.name,
                    }))}
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value)
                      handleCohortChange(value)
                    }}
                    placeholder={
                      availableCohorts.length === 0
                        ? 'Select year, class & branch first'
                        : 'Select cohort'
                    }
                    disabled={availableCohorts.length === 0 || loading}
                  />
                </FormControl>
                <FormDescription>
                  {availableCohorts.length === 0 &&
                    'Please select academic year, class and branch to see available cohorts'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="sectionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section *</FormLabel>
              <FormControl>
                <SearchableDropdown
                  options={availableSections.map((section) => ({
                    value: section.id,
                    label: `${section.name} ${
                      section.capacity > 0
                        ? `(${section._count.enrollments}/${section.capacity} enrolled)`
                        : '(Unlimited)'
                    }`,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={
                    enableCohorts && availableSections.length === 0
                      ? 'Select cohort first'
                      : availableSections.length === 0
                      ? 'Select class first'
                      : 'Select section'
                  }
                  disabled={availableSections.length === 0 || loading}
                />
              </FormControl>
              <FormDescription>
                {enableCohorts && availableSections.length === 0 && 'Please select a cohort to see available sections'}
                {!enableCohorts && availableSections.length === 0 && 'Please select a class to see available sections'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rollNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Roll Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter roll number (optional)" maxLength={50} {...field} />
              </FormControl>
              <FormDescription>Leave blank to auto-generate</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

