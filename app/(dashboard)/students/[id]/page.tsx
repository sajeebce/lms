import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { StudentProfileClient } from './student-profile-client'

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('ADMIN')
  const { id } = await params
  const tenantId = await getTenantId()

  // Fetch tenant settings for phone prefix
  const tenantSettings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  })
  const phonePrefix = tenantSettings?.phonePrefix || '+1'

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
      },
      courseEnrollments: {
        include: {
          course: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      documents: {
        orderBy: { uploadedAt: 'desc' },
      },
    },
  })

  if (!student) {
    notFound()
  }

  return <StudentProfileClient student={student} phonePrefix={phonePrefix} />
}

