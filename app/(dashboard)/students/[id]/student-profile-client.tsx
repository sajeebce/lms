'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  Users,
  School,
  Award,
  BookOpen,
  FileText,
  Edit,
  ArrowLeft,
  Droplet,
  IdCard,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { CopyablePhone, CopyableEmail, CopyableText } from '@/components/ui/copyable-contact'

type StudentProfileProps = {
  student: any
  phonePrefix?: string
}

export function StudentProfileClient({ student, phonePrefix = '+1' }: StudentProfileProps) {
  const enrollment = student.enrollments[0]
  const className = enrollment?.cohort?.class?.name || enrollment?.class?.name || 'N/A'
  const branchName = enrollment?.cohort?.branch?.name || enrollment?.branch?.name || 'N/A'
  const yearName = enrollment?.cohort?.year?.name || enrollment?.academicYear?.name || 'N/A'
  const sectionName = enrollment?.section?.name || 'N/A'

  // Parse previous academic results
  let previousResults: any[] = []
  try {
    if (student.previousAcademicResults) {
      previousResults = JSON.parse(student.previousAcademicResults)
    }
  } catch (e) {
    previousResults = []
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Student Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete information about {student.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/students">
            <Button
              variant="outline"
              size="sm"
              className="dark:text-white dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2 dark:text-white" />
              Back to Students
            </Button>
          </Link>
          <Link href={`/students/${student.id}/edit`}>
            <Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="border-2 border-violet-200 dark:border-violet-800/50 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Photo */}
            <div className="flex-shrink-0">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg">
                  <User className="h-16 w-16 text-white" />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{student.name}</h2>
                  <CopyableText text={student.name} label="Name" />
                </div>
                {/* Removed duplicate name display */}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <Badge className="bg-violet-600 hover:bg-violet-700 text-white">
                    {student.studentId || 'No ID'}
                  </Badge>
                  <Badge
                    variant={student.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className={
                      student.status === 'ACTIVE'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : ''
                    }
                  >
                    {student.status}
                  </Badge>
                  <Badge variant="outline" className="border-indigo-300 text-indigo-700 dark:border-indigo-700 dark:text-indigo-400">
                    {student.gender || 'N/A'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Class</p>
                    <p className="font-semibold">{className}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <School className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Section</p>
                    <p className="font-semibold">{sectionName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Branch</p>
                    <p className="font-semibold">{branchName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <IdCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Roll Number</p>
                    <p className="font-semibold">{student.rollNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card className="border-l-4 border-l-violet-500">
          <CardHeader className="bg-gradient-to-r from-violet-50 to-transparent dark:from-violet-950/20">
            <CardTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </p>
                {student.email ? (
                  <CopyableEmail email={student.email} className="font-medium text-sm" />
                ) : (
                  <p className="font-medium text-sm">N/A</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                  <Phone className="h-3.5 w-3.5" />
                  Phone
                </p>
                {student.phone ? (
                  <CopyablePhone phone={student.phone} prefix={phonePrefix} className="font-medium text-sm" />
                ) : (
                  <p className="font-medium text-sm">N/A</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Date of Birth
                </p>
                <p className="font-medium text-sm">
                  {student.dateOfBirth ? format(new Date(student.dateOfBirth), 'PPP') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                  <Droplet className="h-3.5 w-3.5" />
                  Blood Group
                </p>
                <p className="font-medium text-sm">{student.bloodGroup || 'N/A'}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                <MapPin className="h-3.5 w-3.5" />
                Present Address
              </p>
              <p className="font-medium text-sm">{student.presentAddress || 'N/A'}</p>
            </div>
            {student.permanentAddress && (
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Permanent Address
                </p>
                <p className="font-medium text-sm">{student.permanentAddress}</p>
              </div>
            )}
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                <Calendar className="h-3.5 w-3.5" />
                Admission Date
              </p>
              <p className="font-medium text-sm">
                {format(new Date(student.admissionDate), 'PPP')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Guardian Information */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/20">
            <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Users className="h-5 w-5" />
              Guardian Information ({student.guardians.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {student.guardians.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No guardian information available</p>
            ) : (
              student.guardians.map((guardian: any, index: number) => (
                <div
                  key={guardian.id}
                  className={`p-4 rounded-lg border-2 ${
                    guardian.isPrimary
                      ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">Guardian {index + 1}</h4>
                    {guardian.isPrimary && (
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                        Primary
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <CopyableText text={guardian.name} label="Guardian name" className="font-medium" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Relationship</p>
                      <p className="font-medium">{guardian.relationship}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <CopyablePhone phone={guardian.phone} prefix={phonePrefix} className="font-medium" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      {guardian.email ? (
                        <CopyableEmail email={guardian.email} className="font-medium" />
                      ) : (
                        <p className="font-medium">N/A</p>
                      )}
                    </div>
                    {guardian.occupation && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Occupation</p>
                        <p className="font-medium">{guardian.occupation}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Previous School Information */}
      {student.previousSchoolName && (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20">
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <School className="h-5 w-5" />
              Previous School Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">School Name</p>
                <p className="font-medium text-sm">{student.previousSchoolName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Address</p>
                <p className="font-medium text-sm">{student.previousSchoolAddress || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Last Class</p>
                <p className="font-medium text-sm">{student.previousClass || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Board</p>
                <p className="font-medium text-sm">{student.previousBoard || 'N/A'}</p>
              </div>
              {student.tcNumber && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">TC Number</p>
                  <p className="font-medium text-sm">{student.tcNumber}</p>
                </div>
              )}
            </div>

            {/* Academic Results */}
            {previousResults.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-400">
                    <Award className="h-4 w-4" />
                    Academic Results
                  </h4>
                  <div className="space-y-3">
                    {previousResults.map((result: any, index: number) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/10"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Exam</p>
                            <p className="font-semibold">{result.examName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Year</p>
                            <p className="font-medium">{result.year}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">GPA/Marks</p>
                            <p className="font-medium">{result.gpa || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Grade</p>
                            <p className="font-medium">{result.grade || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Enrollments */}
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-transparent dark:from-indigo-950/20">
            <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
              <BookOpen className="h-5 w-5" />
              Course Enrollments ({student.courseEnrollments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {student.courseEnrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No course enrollments yet
              </p>
            ) : (
              <div className="space-y-2">
                {student.courseEnrollments.map((enrollment: any) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/10"
                  >
                    <div>
                      <p className="font-semibold text-sm">{enrollment.course.name}</p>
                      <p className="text-xs text-muted-foreground">{enrollment.course.code}</p>
                    </div>
                    <Badge
                      variant={enrollment.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className={
                        enrollment.status === 'ACTIVE'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : ''
                      }
                    >
                      {enrollment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="border-l-4 border-l-cyan-500">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-transparent dark:from-cyan-950/20">
            <CardTitle className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
              <FileText className="h-5 w-5" />
              Documents ({student.documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {student.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No documents uploaded yet
              </p>
            ) : (
              <div className="space-y-2">
                {student.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-cyan-200 bg-cyan-50/50 dark:border-cyan-800 dark:bg-cyan-950/10"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{doc.documentType}</p>
                      <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(doc.uploadedAt), 'PPP')}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enrollment History */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-950/20">
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
            <GraduationCap className="h-5 w-5" />
            Enrollment History ({student.enrollments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {student.enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No enrollment history
            </p>
          ) : (
            <div className="space-y-3">
              {student.enrollments.map((enroll: any, index: number) => {
                const enrollClass = enroll.cohort?.class?.name || enroll.class?.name || 'N/A'
                const enrollBranch = enroll.cohort?.branch?.name || enroll.branch?.name || 'N/A'
                const enrollYear = enroll.cohort?.year?.name || enroll.academicYear?.name || 'N/A'

                return (
                  <div
                    key={enroll.id}
                    className={`p-4 rounded-lg border-2 ${
                      index === 0
                        ? 'border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-950/20'
                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">
                          {enrollClass} - {enroll.section.name}
                        </h4>
                        {index === 0 && (
                          <Badge className="bg-purple-600 hover:bg-purple-700 text-white text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <Badge
                        variant={enroll.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className={
                          enroll.status === 'ACTIVE'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : ''
                        }
                      >
                        {enroll.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Academic Year</p>
                        <p className="font-medium">{enrollYear}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Branch</p>
                        <p className="font-medium">{enrollBranch}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Enrollment Type</p>
                        <p className="font-medium">{enroll.enrollmentType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Enrolled On</p>
                        <p className="font-medium">
                          {format(new Date(enroll.enrollmentDate), 'PP')}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

