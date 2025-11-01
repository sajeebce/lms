import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { Edit } from 'lucide-react'
import { EditStudentForm } from './edit-student-form'
import { format } from 'date-fns'

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('ADMIN')
  const { id } = await params
  const tenantId = await getTenantId()

  const student = await prisma.student.findFirst({
    where: {
      id,
      tenantId,
    },
    include: {
      user: true,
      guardians: {
        orderBy: { isPrimary: 'desc' },
      },
      enrollments: {
        include: {
          section: true,
          cohort: {
            include: {
              year: true,
              class: true,
              branch: true,
            },
          },
          academicYear: true,
          class: true,
          branch: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!student) {
    notFound()
  }

  // Fetch branches, academic years, classes for dropdowns
  const [branches, academicYears, classes] = await Promise.all([
    prisma.branch.findMany({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    }),
    prisma.academicYear.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
    }),
    prisma.class.findMany({
      where: { tenantId },
      orderBy: { order: 'asc' },
    }),
  ])

  // Parse previous academic results
  let previousAcademicResults: any[] = []
  try {
    if (student.previousAcademicResults) {
      previousAcademicResults = JSON.parse(student.previousAcademicResults)
    }
  } catch (e) {
    previousAcademicResults = []
  }

  // Get current enrollment
  const currentEnrollment = student.enrollments[0]

  // Prepare student data for form
  const studentData = {
    id: student.id,
    name: student.name,
    email: student.email || '',
    phone: student.phone || '',
    dateOfBirth: student.dateOfBirth ? format(new Date(student.dateOfBirth), 'yyyy-MM-dd') : '',
    gender: student.gender || 'MALE',
    bloodGroup: student.bloodGroup || '',
    photoUrl: student.photoUrl || '',
    presentAddress: student.presentAddress || '',
    permanentAddress: student.permanentAddress || '',
    username: student.user?.username || '',
    password: '******', // Placeholder - will not be shown in edit
    rollNumber: student.rollNumber || '',
    previousSchoolName: student.previousSchoolName || '',
    previousSchoolAddress: student.previousSchoolAddress || '',
    previousClass: student.previousClass || '',
    previousBoard: student.previousBoard || '',
    tcNumber: student.tcNumber || '',
    previousAcademicResults,
    guardians: student.guardians.map((g) => ({
      id: g.id,
      name: g.name,
      relationship: g.relationship,
      phone: g.phone,
      email: g.email || '',
      occupation: g.occupation || '',
      address: g.address || '',
      isPrimary: g.isPrimary,
    })),
    branchId: currentEnrollment?.cohort?.branchId || currentEnrollment?.branchId || '',
    academicYearId: currentEnrollment?.cohort?.yearId || currentEnrollment?.academicYearId || '',
    classId: currentEnrollment?.cohort?.classId || currentEnrollment?.classId || '',
    cohortId: currentEnrollment?.cohortId || '',
    sectionId: currentEnrollment?.sectionId || '',
    enrollmentId: currentEnrollment?.id || '',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Student"
        description={`Update information for ${student.name}`}
        icon={Edit}
        bgColor="bg-amber-50"
        iconBgColor="bg-amber-600"
      />

      <EditStudentForm
        student={studentData}
        branches={branches}
        academicYears={academicYears}
        classes={classes}
      />
    </div>
  )
}

