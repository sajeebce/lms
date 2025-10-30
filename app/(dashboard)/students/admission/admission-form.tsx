'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { admitStudent, getAvailableCohorts, getAvailableSections } from './actions'
import { UserPlus } from 'lucide-react'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'

type Branch = { id: string; name: string }
type AcademicYear = { id: string; name: string; code: string }
type Class = { id: string; name: string }
type Stream = { id: string; name: string }
type Section = { id: string; name: string; capacity: number; _count: { enrollments: number } }
type Cohort = { id: string; name: string }

const admissionSchema = z.object({
  fullName: z.string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be 100 characters or less'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(100, 'Email must be 100 characters or less'),
  phone: z.string()
    .max(20, 'Phone must be 20 characters or less')
    .optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  address: z.string()
    .max(200, 'Address must be 200 characters or less')
    .optional(),
  fatherName: z.string()
    .max(100, 'Father name must be 100 characters or less')
    .optional(),
  fatherPhone: z.string()
    .max(20, 'Father phone must be 20 characters or less')
    .optional(),
  branchId: z.string().optional(),
  yearId: z.string().min(1, 'Academic year is required'),
  classId: z.string().min(1, 'Class is required'),
  streamId: z.string().optional(),
  sectionId: z.string().min(1, 'Section is required'),
  cohortId: z.string().optional(),
})

type FormValues = z.infer<typeof admissionSchema>

export function AdmissionForm({
  branches,
  academicYears,
  classes,
  streams,
  enableCohorts,
}: {
  branches: Branch[]
  academicYears: AcademicYear[]
  classes: Class[]
  streams: Stream[]
  enableCohorts: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [availableCohorts, setAvailableCohorts] = useState<Cohort[]>([])
  const [availableSections, setAvailableSections] = useState<Section[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: undefined,
      address: '',
      fatherName: '',
      fatherPhone: '',
      branchId: '',
      yearId: '',
      classId: '',
      streamId: '',
      sectionId: '',
      cohortId: '',
    },
  })

  const handleYearChange = async (yearId: string) => {
    form.setValue('cohortId', '')
    form.setValue('sectionId', '')
    setAvailableCohorts([])
    setAvailableSections([])
  }

  const handleClassChange = async (classId: string) => {
    form.setValue('cohortId', '')
    form.setValue('sectionId', '')
    setAvailableCohorts([])
    setAvailableSections([])
  }

  const handleBranchChange = async (branchId: string) => {
    form.setValue('cohortId', '')
    form.setValue('sectionId', '')
    setAvailableCohorts([])
    setAvailableSections([])

    const yearId = form.getValues('yearId')
    const classId = form.getValues('classId')
    const streamId = form.getValues('streamId')

    if (enableCohorts && yearId && classId && branchId) {
      setLoading(true)
      const result = await getAvailableCohorts({ yearId, classId, branchId, streamId })
      setLoading(false)
      if (result.success) {
        setAvailableCohorts(result.data as Cohort[])
      }
    }
  }

  const handleStreamChange = async (streamId: string) => {
    form.setValue('cohortId', '')
    form.setValue('sectionId', '')
    setAvailableCohorts([])
    setAvailableSections([])

    const yearId = form.getValues('yearId')
    const classId = form.getValues('classId')
    const branchId = form.getValues('branchId')

    if (enableCohorts && yearId && classId && branchId) {
      setLoading(true)
      const result = await getAvailableCohorts({ yearId, classId, branchId, streamId })
      setLoading(false)
      if (result.success) {
        setAvailableCohorts(result.data as Cohort[])
      }
    }
  }

  const handleCohortChange = async (cohortId: string) => {
    form.setValue('sectionId', '')
    setLoading(true)
    const result = await getAvailableSections(cohortId)
    setLoading(false)
    if (result.success) {
      setAvailableSections(result.data as Section[])
    }
  }

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    const result = await admitStudent(data)
    setLoading(false)

    if (result.success) {
      toast.success('Student admitted successfully! 🎉')
      form.reset()
      setAvailableCohorts([])
      setAvailableSections([])
    } else {
      toast.error(result.error || 'Failed to admit student')
    }
  }

  return (
    <Card className="border-blue-200 dark:border-blue-800/30 bg-gradient-to-br from-white to-blue-50/30 dark:from-card dark:to-blue-950/20">
      <CardHeader className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 dark:bg-blue-700 rounded-lg">
            <UserPlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Student Admission</CardTitle>
            <CardDescription className="text-blue-900 dark:text-blue-300">
              Enroll a new student in the institution
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" maxLength={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="student@example.com" maxLength={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" maxLength={20} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <SearchableDropdown
                          options={[
                            { value: 'Male', label: 'Male' },
                            { value: 'Female', label: 'Female' },
                            { value: 'Other', label: 'Other' },
                          ]}
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Select gender"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter address" maxLength={200} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Guardian Information Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Guardian Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fatherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter father name" maxLength={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fatherPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter father phone" maxLength={20} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Academic Setup Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Academic Information</h3>
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
                            onChange={(value) => { field.onChange(value); handleBranchChange(value) }}
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
                  name="yearId"
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
                          onChange={(value) => { field.onChange(value); handleYearChange(value) }}
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
                          onChange={(value) => { field.onChange(value); handleClassChange(value) }}
                          placeholder="Select class"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {streams.length > 0 && (
                  <FormField
                    control={form.control}
                    name="streamId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stream</FormLabel>
                        <FormControl>
                          <SearchableDropdown
                            options={streams.map((stream) => ({
                              value: stream.id,
                              label: stream.name,
                            }))}
                            value={field.value || ''}
                            onChange={(value) => { field.onChange(value); handleStreamChange(value) }}
                            placeholder="Select stream (optional)"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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
                            onChange={(value) => { field.onChange(value); handleCohortChange(value) }}
                            placeholder={availableCohorts.length === 0 ? "Select year, class & branch first" : "Select cohort"}
                            disabled={availableCohorts.length === 0}
                          />
                        </FormControl>
                        <FormDescription>
                          {availableCohorts.length === 0 && 'Please select academic year, class and branch to see available cohorts'}
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
                            label: `${section.name} (${section._count.enrollments}/${section.capacity} enrolled)`,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={enableCohorts && availableSections.length === 0 ? "Select cohort first" : "Select section"}
                          disabled={enableCohorts ? availableSections.length === 0 : false}
                        />
                      </FormControl>
                      <FormDescription>
                        {enableCohorts && availableSections.length === 0 && 'Please select a cohort to see available sections'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset()
                  setAvailableCohorts([])
                  setAvailableSections([])
                }}
                disabled={loading}
              >
                Reset
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? 'Admitting...' : 'Admit Student'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

