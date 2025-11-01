'use client'

import { UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, User, GraduationCap, Users, School, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Branch = { id: string; name: string }
type AcademicYear = { id: string; name: string; code: string }
type Class = { id: string; name: string }

export function ReviewSubmitStep({
  form,
  branches,
  academicYears,
  classes,
  onEditStep,
}: {
  form: UseFormReturn<any>
  branches: Branch[]
  academicYears: AcademicYear[]
  classes: Class[]
  onEditStep: (step: number) => void
}) {
  const values = form.getValues()

  const getBranchName = (id: string) => branches.find((b) => b.id === id)?.name || 'N/A'
  const getYearName = (id: string) => {
    const year = academicYears.find((y) => y.id === id)
    return year ? `${year.name} (${year.code})` : 'N/A'
  }
  const getClassName = (id: string) => classes.find((c) => c.id === id)?.name || 'N/A'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Review & Submit</h3>
          <p className="text-sm text-muted-foreground">Please review all information before submitting</p>
        </div>
      </div>

      {/* Student Identity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Student Identity
          </CardTitle>
          <Button type="button" variant="ghost" size="sm" onClick={() => onEditStep(0)}>
            <Edit className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Name</p>
            <p className="font-medium">{values.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{values.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Phone</p>
            <p className="font-medium">{values.phone || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Date of Birth</p>
            <p className="font-medium">{values.dateOfBirth || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Gender</p>
            <p className="font-medium">{values.gender || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Blood Group</p>
            <p className="font-medium">{values.bloodGroup || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Username</p>
            <p className="font-medium font-mono text-blue-600 dark:text-blue-400">{values.username || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Password</p>
            <p className="font-medium font-mono">{'•'.repeat(values.password?.length || 0) || 'N/A'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Present Address</p>
            <p className="font-medium">{values.presentAddress || 'N/A'}</p>
          </div>
          {values.permanentAddress && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Permanent Address</p>
              <p className="font-medium">{values.permanentAddress}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Academic Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Academic Information
          </CardTitle>
          <Button type="button" variant="ghost" size="sm" onClick={() => onEditStep(1)}>
            <Edit className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          {values.branchId && (
            <div>
              <p className="text-muted-foreground">Branch</p>
              <p className="font-medium">{getBranchName(values.branchId)}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Academic Year</p>
            <p className="font-medium">{getYearName(values.academicYearId)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Class</p>
            <p className="font-medium">{getClassName(values.classId)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Section</p>
            <p className="font-medium">{values.sectionId ? 'Selected' : 'N/A'}</p>
          </div>
          {values.rollNumber && (
            <div>
              <p className="text-muted-foreground">Roll Number</p>
              <p className="font-medium">{values.rollNumber}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guardian Information */}
      {values.guardians && values.guardians.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Guardian Information ({values.guardians.length})
            </CardTitle>
            <Button type="button" variant="ghost" size="sm" onClick={() => onEditStep(2)}>
              <Edit className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {values.guardians.map((guardian: any, index: number) => (
              <div key={index} className="border-l-2 border-emerald-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-semibold">Guardian {index + 1}</p>
                  {guardian.isPrimary && (
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full">
                      Primary
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{guardian.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Relationship</p>
                    <p className="font-medium">{guardian.relationship || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{guardian.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{guardian.email || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Previous School */}
      {values.previousSchoolName && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <School className="h-4 w-4" />
              Previous School
            </CardTitle>
            <Button type="button" variant="ghost" size="sm" onClick={() => onEditStep(3)}>
              <Edit className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">School Name</p>
                <p className="font-medium">{values.previousSchoolName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Address</p>
                <p className="font-medium">{values.previousSchoolAddress || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Class</p>
                <p className="font-medium">{values.previousClass || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Board</p>
                <p className="font-medium">{values.previousBoard || 'N/A'}</p>
              </div>
              {values.tcNumber && (
                <div>
                  <p className="text-muted-foreground">TC Number</p>
                  <p className="font-medium">{values.tcNumber}</p>
                </div>
              )}
            </div>

            {/* Previous Academic Results */}
            {values.previousAcademicResults && values.previousAcademicResults.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm font-semibold mb-3 text-amber-700 dark:text-amber-400">
                  Academic Results ({values.previousAcademicResults.length})
                </p>
                <div className="space-y-3">
                  {values.previousAcademicResults.map((result: any, index: number) => (
                    <div key={index} className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Exam Name</p>
                          <p className="font-medium">{result.examName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Year</p>
                          <p className="font-medium">{result.year || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">GPA/Marks</p>
                          <p className="font-medium">{result.gpa || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Grade</p>
                          <p className="font-medium">{result.grade || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          ✓ Please review all information carefully. Once submitted, the student will be admitted to the institution.
        </p>
      </div>
    </div>
  )
}

