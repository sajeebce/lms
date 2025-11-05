'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Check, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StudentIdentityStep } from '../../admission/components/student-identity-step'
import { AcademicInfoStep } from '../../admission/components/academic-info-step'
import { GuardianInfoStep } from '../../admission/components/guardian-info-step'
import { PreviousSchoolStep } from '../../admission/components/previous-school-step'
import { ReviewSubmitStep } from '../../admission/components/review-submit-step'
import { updateStudent } from './actions'
import { getAvailableSections, getAvailableCohorts } from '../../admission/new-actions'
import Link from 'next/link'
import { useEffect } from 'react'

type Branch = { id: string; name: string }
type AcademicYear = { id: string; name: string; code: string }
type Class = { id: string; name: string }
type Cohort = { id: string; name: string }
type Section = { id: string; name: string }

const editStudentSchema = z.object({
  // Student Identity
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().min(1, 'Email is required').email('Invalid email').max(100),
  phone: z.string().min(1, 'Phone number is required').max(20),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { message: 'Gender is required' }),
  bloodGroup: z.string().max(10).optional().or(z.literal('')),
  photoUrl: z.string().optional().or(z.literal('')),
  presentAddress: z.string().max(200).optional().or(z.literal('')),
  permanentAddress: z.string().max(200).optional().or(z.literal('')),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),

  // Academic Information
  branchId: z.string().optional().or(z.literal('')),
  academicYearId: z.string().min(1, 'Academic year is required'),
  classId: z.string().min(1, 'Class is required'),
  cohortId: z.string().optional().or(z.literal('')),
  sectionId: z.string().min(1, 'Section is required'),
  rollNumber: z.string().max(50).optional().or(z.literal('')),

  // Guardians
  guardians: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1, 'Guardian name is required').max(100),
        relationship: z.string().min(1, 'Relationship is required').max(50),
        phone: z.string().min(1, 'Phone is required').max(20),
        email: z.string().email('Invalid email').max(100).optional().or(z.literal('')),
        occupation: z.string().max(100).optional().or(z.literal('')),
        address: z.string().max(200).optional().or(z.literal('')),
        isPrimary: z.boolean(),
      })
    )
    .min(1, 'At least one guardian is required'),

  // Previous School (Optional)
  previousSchoolName: z.string().max(200).optional().or(z.literal('')),
  previousSchoolAddress: z.string().max(200).optional().or(z.literal('')),
  previousClass: z.string().max(50).optional().or(z.literal('')),
  previousBoard: z.string().max(100).optional().or(z.literal('')),
  tcNumber: z.string().max(50).optional().or(z.literal('')),
  previousAcademicResults: z
    .array(
      z.object({
        examName: z.string().max(100),
        year: z.string().max(4),
        gpa: z.string().max(20).optional().or(z.literal('')),
        grade: z.string().max(50).optional().or(z.literal('')),
      })
    )
    .optional(),
})

type FormValues = z.infer<typeof editStudentSchema>

const steps = [
  { id: 0, name: 'Student Identity', icon: '👤' },
  { id: 1, name: 'Academic Info', icon: '🎓' },
  { id: 2, name: 'Guardian Info', icon: '👨‍👩‍👧' },
  { id: 3, name: 'Previous School', icon: '🏫' },
  { id: 4, name: 'Review & Submit', icon: '✓' },
]

export function EditStudentForm({
  student,
  branches,
  academicYears,
  classes,
  phonePrefix = '+1',
  enableCohorts = false,
}: {
  student: any
  branches: Branch[]
  academicYears: AcademicYear[]
  classes: Class[]
  phonePrefix?: string
  enableCohorts?: boolean
}) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [availableCohorts, setAvailableCohorts] = useState<any[]>([])
  const [availableSections, setAvailableSections] = useState<any[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: {
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      dateOfBirth: student.dateOfBirth || '',
      gender: student.gender || 'MALE',
      bloodGroup: student.bloodGroup || '',
      photoUrl: student.photoUrl || '',
      presentAddress: student.presentAddress || '',
      permanentAddress: student.permanentAddress || '',
      username: student.username || '',
      password: student.password || '',
      branchId: student.branchId || '',
      academicYearId: student.academicYearId || '',
      classId: student.classId || '',
      cohortId: student.cohortId || '',
      sectionId: student.sectionId || '',
      rollNumber: student.rollNumber || '',
      guardians: student.guardians || [],
      previousSchoolName: student.previousSchoolName || '',
      previousSchoolAddress: student.previousSchoolAddress || '',
      previousClass: student.previousClass || '',
      previousBoard: student.previousBoard || '',
      tcNumber: student.tcNumber || '',
      previousAcademicResults: student.previousAcademicResults || [],
    },
  })

  // Initialize form values and enrollment data on mount
  useEffect(() => {
    // Reset form with student data to ensure all fields are populated
    const formData = {
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      dateOfBirth: student.dateOfBirth || '',
      gender: student.gender || 'MALE',
      bloodGroup: student.bloodGroup || '',
      photoUrl: student.photoUrl || '',
      presentAddress: student.presentAddress || '',
      permanentAddress: student.permanentAddress || '',
      username: student.username || '',
      password: student.password || '',
      branchId: student.branchId || '',
      academicYearId: student.academicYearId || '',
      classId: student.classId || '',
      cohortId: student.cohortId || '',
      sectionId: student.sectionId || '',
      rollNumber: student.rollNumber || '',
      guardians: student.guardians || [],
      previousSchoolName: student.previousSchoolName || '',
      previousSchoolAddress: student.previousSchoolAddress || '',
      previousClass: student.previousClass || '',
      previousBoard: student.previousBoard || '',
      tcNumber: student.tcNumber || '',
      previousAcademicResults: student.previousAcademicResults || [],
    }

    form.reset(formData)

    const initializeEnrollmentData = async () => {
      if (student.academicYearId && student.classId && student.branchId) {
        // Fetch available cohorts
        const cohortsResult = await handleFetchCohorts(
          student.academicYearId,
          student.classId,
          student.branchId
        )
        setAvailableCohorts(cohortsResult)

        // Fetch available sections if cohort is selected
        if (student.cohortId) {
          const sectionsResult = await handleFetchSections(student.cohortId)
          setAvailableSections(sectionsResult)
        }
      }
    }

    initializeEnrollmentData()
  }, [student, form])

  const handleFetchCohorts = async (yearId: string, classId: string, branchId: string) => {
    const result = await getAvailableCohorts(yearId, classId, branchId)
    return result.success ? result.data : []
  }

  const handleFetchSections = async (cohortId?: string, classId?: string) => {
    const result = await getAvailableSections(cohortId, classId)
    return result.success ? result.data : []
  }

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true)
      const result = await updateStudent(student.id, data)

      if (result.success) {
        toast.success('Student updated successfully! 🎉')
        setTimeout(() => {
          router.push(`/students/${student.id}`)
        }, 1500)
      } else {
        toast.error(result.error || 'Failed to update student')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = async () => {
    const fields = getFieldsForStep(currentStep)
    const isValid = await form.trigger(fields as any)

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const goToStep = async (targetStep: number) => {
    // If going backwards, no validation needed
    if (targetStep < currentStep) {
      setCurrentStep(targetStep)
      return
    }

    // If going forward, validate all intermediate steps
    for (let i = currentStep; i < targetStep; i++) {
      const fields = getFieldsForStep(i)
      const isValid = await form.trigger(fields as any)
      if (!isValid) {
        toast.error(`Please complete step ${i + 1} first`)
        return
      }
    }

    setCurrentStep(targetStep)
  }

  const getFieldsForStep = (step: number): string[] => {
    switch (step) {
      case 0:
        return ['name', 'email', 'phone', 'dateOfBirth', 'gender', 'username', 'password']
      case 1:
        return ['academicYearId', 'classId', 'sectionId']
      case 2:
        return ['guardians']
      case 3:
        return []
      case 4:
        return []
      default:
        return []
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/students">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Students
              </Button>
            </Link>
          </div>
          <Link href={`/students/${student.id}`}>
            <Button variant="outline" size="sm">
              View Profile
            </Button>
          </Link>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className="flex flex-col items-center flex-1 cursor-pointer group"
                  onClick={() => goToStep(index)}
                  title={`Go to ${step.name}`}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold transition-all',
                      index < currentStep
                        ? 'bg-emerald-600 text-white group-hover:bg-emerald-700'
                        : index === currentStep
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-slate-200 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
                    )}
                  >
                    {index < currentStep ? <Check className="h-5 w-5" /> : step.icon}
                  </div>
                  <p
                    className={cn(
                      'text-xs mt-2 font-medium',
                      index === currentStep
                        ? 'text-violet-600 dark:text-violet-300'
                        : index < currentStep
                        ? 'text-emerald-600 dark:text-emerald-300'
                        : 'text-gray-500 dark:text-slate-200'
                    )}
                  >
                    {step.name}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'h-1 flex-1 mx-2 rounded transition-all',
                      index < currentStep
                        ? 'bg-emerald-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {currentStep === 0 && <StudentIdentityStep form={form} phonePrefix={phonePrefix} mode="edit" />}
            {currentStep === 1 && (
              <AcademicInfoStep
                form={form}
                branches={branches}
                academicYears={academicYears}
                classes={classes}
                enableCohorts={enableCohorts}
                onFetchCohorts={handleFetchCohorts}
                onFetchSections={handleFetchSections}
              />
            )}
            {currentStep === 2 && <GuardianInfoStep form={form} phonePrefix={phonePrefix} />}
            {currentStep === 3 && <PreviousSchoolStep form={form} />}
            {currentStep === 4 && (
              <ReviewSubmitStep
                form={form}
                branches={branches}
                academicYears={academicYears}
                classes={classes}
                onEditStep={(step) => setCurrentStep(step)}
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={nextStep} disabled={loading}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                >
                  {loading ? 'Updating...' : 'Update Student'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

