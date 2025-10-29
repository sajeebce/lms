'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { admitStudent, getAvailableCohorts, getAvailableSections } from './actions'
import { UserPlus } from 'lucide-react'

type Branch = { id: string; name: string }
type AcademicYear = { id: string; name: string; code: string }
type Class = { id: string; name: string }
type Stream = { id: string; name: string }
type Section = { id: string; name: string; capacity: number; _count: { enrollments: number } }
type Cohort = { id: string; name: string }

const admissionSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  address: z.string().optional(),
  fatherName: z.string().optional(),
  fatherPhone: z.string().optional(),
  branchId: z.string().optional(), // Will be validated based on enableCohorts
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
    form.setValue('yearId', yearId)
    setAvailableCohorts([])
    setAvailableSections([])
  }

  const handleClassChange = async (classId: string) => {
    form.setValue('classId', classId)
    setAvailableCohorts([])
    setAvailableSections([])
  }

  const handleCohortChange = async (cohortId: string) => {
    form.setValue('cohortId', cohortId)
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Enter full name"
                  {...form.register('fullName')}
                />
                {form.formState.errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.fullName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  {...form.register('phone')}
                />
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...form.register('dateOfBirth')}
                />
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={form.watch('gender') || ''} onValueChange={(v) => form.setValue('gender', v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Enter address"
                  {...form.register('address')}
                />
              </div>

              <div>
                <Label htmlFor="fatherName">Father's Name</Label>
                <Input
                  id="fatherName"
                  placeholder="Enter father's name"
                  {...form.register('fatherName')}
                />
              </div>

              <div>
                <Label htmlFor="fatherPhone">Father's Phone</Label>
                <Input
                  id="fatherPhone"
                  placeholder="Enter father's phone"
                  {...form.register('fatherPhone')}
                />
              </div>
            </div>
          </div>

          {/* Academic Setup Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Academic Setup</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enableCohorts && (
                <div>
                  <Label htmlFor="branchId">Branch *</Label>
                  <Select value={form.watch('branchId')} onValueChange={(v) => form.setValue('branchId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.branchId && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.branchId.message}</p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="yearId">Academic Year *</Label>
                <Select value={form.watch('yearId')} onValueChange={handleYearChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.yearId && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.yearId.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="classId">Class *</Label>
                <Select value={form.watch('classId')} onValueChange={handleClassChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.classId && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.classId.message}</p>
                )}
              </div>

              {streams.length > 0 && (
                <div>
                  <Label htmlFor="streamId">Stream</Label>
                  <Select value={form.watch('streamId') || ''} onValueChange={(v) => form.setValue('streamId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stream (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {streams.map((stream) => (
                        <SelectItem key={stream.id} value={stream.id}>
                          {stream.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {enableCohorts && (
                <div>
                  <Label htmlFor="cohortId">Cohort *</Label>
                  <Select value={form.watch('cohortId') || ''} onValueChange={handleCohortChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cohort" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCohorts.map((cohort) => (
                        <SelectItem key={cohort.id} value={cohort.id}>
                          {cohort.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="sectionId">Section *</Label>
                <Select value={form.watch('sectionId')} onValueChange={(v) => form.setValue('sectionId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name} ({section._count.enrollments}/{section.capacity || '∞'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.sectionId && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.sectionId.message}</p>
                )}
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Admitting...' : 'Admit Student'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

