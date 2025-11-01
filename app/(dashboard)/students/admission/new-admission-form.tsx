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
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StudentIdentityStep } from './components/student-identity-step'
import { AcademicInfoStep } from './components/academic-info-step'
import { GuardianInfoStep } from './components/guardian-info-step'
import { PreviousSchoolStep } from './components/previous-school-step'
import { ReviewSubmitStep } from './components/review-submit-step'
import { admitStudent, getAvailableCohorts, getAvailableSections } from './new-actions'

type Branch = { id: string; name: string }
type AcademicYear = { id: string; name: string; code: string }
type Class = { id: string; name: string }

const admissionSchema = z.object({
  // Student Identity
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').max(100).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { required_error: 'Gender is required' }),
  bloodGroup: z.string().max(10).optional().or(z.literal('')),
  photoUrl: z.string().optional().or(z.literal('')),
  presentAddress: z.string().max(200).optional().or(z.literal('')),
  permanentAddress: z.string().max(200).optional().or(z.literal('')),

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
        name: z.string().min(1, 'Guardian name is required').max(100),
        relationship: z.string().min(1, 'Relationship is required').max(50),
        phone: z.string().min(1, 'Phone is required').max(20),
        email: z.string().email('Invalid email').max(100).optional().or(z.literal('')),
        occupation: z.string().max(100).optional().or(z.literal('')),
        address: z.string().max(200).optional().or(z.literal('')),
        isPrimary: z.boolean().default(false),
      })
    )
    .min(1, 'At least one guardian is required'),

  // Previous School (Optional)
  previousSchoolName: z.string().max(200).optional().or(z.literal('')),
  previousSchoolAddress: z.string().max(200).optional().or(z.literal('')),
  previousClass: z.string().max(50).optional().or(z.literal('')),
  previousBoard: z.string().max(100).optional().or(z.literal('')),
  tcNumber: z.string().max(50).optional().or(z.literal('')),
})

type FormValues = z.infer<typeof admissionSchema>

const steps = [
  { id: 0, name: 'Student Identity', icon: '👤' },
  { id: 1, name: 'Academic Info', icon: '🎓' },
  { id: 2, name: 'Guardian Info', icon: '👨‍👩‍👧' },
  { id: 3, name: 'Previous School', icon: '🏫' },
  { id: 4, name: 'Review & Submit', icon: '✓' },
]

export function NewAdmissionForm({
  branches,
  academicYears,
  classes,
  enableCohorts,
}: {
  branches: Branch[]
  academicYears: AcademicYear[]
  classes: Class[]
  enableCohorts: boolean
}) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: undefined,
      bloodGroup: '',
      photoUrl: '',
      presentAddress: '',
      permanentAddress: '',
      branchId: branches.length === 1 ? branches[0].id : '',
      academicYearId: '',
      classId: '',
      cohortId: '',
      sectionId: '',
      rollNumber: '',
      guardians: [],
      previousSchoolName: '',
      previousSchoolAddress: '',
      previousClass: '',
      previousBoard: '',
      tcNumber: '',
    },
  })

  const handleFetchCohorts = async (yearId: string, classId: string, branchId: string) => {
    const result = await getAvailableCohorts(yearId, classId, branchId)
    return result.success ? result.data : []
  }

  const handleFetchSections = async (cohortId?: string, classId?: string) => {
    const result = await getAvailableSections(cohortId, classId)
    return result.success ? result.data : []
  }

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof FormValues)[] = []

    switch (step) {
      case 0: // Student Identity
        fieldsToValidate = ['name', 'dateOfBirth', 'gender']
        break
      case 1: // Academic Info
        fieldsToValidate = ['academicYearId', 'classId', 'sectionId']
        if (enableCohorts && branches.length > 1) {
          fieldsToValidate.push('branchId')
        }
        if (enableCohorts) {
          fieldsToValidate.push('cohortId')
        }
        break
      case 2: // Guardian Info
        fieldsToValidate = ['guardians']
        break
      case 3: // Previous School (optional, always valid)
        return true
      case 4: // Review (validate all)
        return form.trigger()
    }

    const result = await form.trigger(fieldsToValidate)
    return result
  }

  const nextStep = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    const result = await admitStudent(data, enableCohorts)
    setLoading(false)

    if (result.success) {
      toast.success('Student admitted successfully! 🎉')
      router.push('/students')
    } else {
      toast.error(result.error || 'Failed to admit student')
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all',
                  currentStep > index
                    ? 'bg-emerald-500 text-white'
                    : currentStep === index
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/30'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                )}
              >
                {currentStep > index ? <Check className="w-5 h-5" /> : step.icon}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium text-center',
                  currentStep >= index ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-1 flex-1 mx-2 transition-all',
                  currentStep > index ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {currentStep === 0 && <StudentIdentityStep form={form} />}
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
              {currentStep === 2 && <GuardianInfoStep form={form} />}
              {currentStep === 3 && <PreviousSchoolStep form={form} />}
              {currentStep === 4 && (
                <ReviewSubmitStep
                  form={form}
                  branches={branches}
                  academicYears={academicYears}
                  classes={classes}
                  onEditStep={setCurrentStep}
                />
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0 || loading}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button type="button" onClick={nextStep} disabled={loading}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Admission'}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

