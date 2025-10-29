import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'
import { PageHeader } from '@/components/page-header'
import { UserPlus } from 'lucide-react'
import { AdmissionForm } from './admission-form'

export default async function AdmissionPage() {
  await requireRole('ADMIN')
  const tenantId = await getTenantId()

  // Fetch tenant settings to check if cohorts are enabled
  const tenantSettings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  })

  const enableCohorts = tenantSettings?.enableCohorts ?? true

  // Fetch all required data
  const [branches, academicYears, classes, streams] = await Promise.all([
    prisma.branch.findMany({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    }),
    prisma.academicYear.findMany({
      where: {
        tenantId,
        state: { in: ['PLANNED', 'IN_SESSION'] }, // Only show PLANNED and IN_SESSION years
      },
      orderBy: { startDate: 'desc' },
    }),
    prisma.class.findMany({
      where: { tenantId },
      orderBy: { order: 'asc' },
    }),
    prisma.stream.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Admission"
        description="Enroll a new student in the institution"
        icon={UserPlus}
        bgColor="bg-blue-50"
        iconBgColor="bg-blue-600"
      />

      <div className="max-w-2xl">
        <AdmissionForm
          branches={branches}
          academicYears={academicYears}
          classes={classes}
          streams={streams}
          enableCohorts={enableCohorts}
        />
      </div>
    </div>
  )
}

