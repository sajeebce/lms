import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'
import { PageHeader } from '@/components/page-header'
import { UserPlus } from 'lucide-react'
import { NewAdmissionForm } from './new-admission-form'

export default async function AdmissionPage() {
  await requireRole('ADMIN')
  const tenantId = await getTenantId()

  // Fetch tenant settings to check if cohorts are enabled and get phone prefix
  const tenantSettings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  })

  const enableCohorts = tenantSettings?.enableCohorts ?? true
  const phonePrefix = tenantSettings?.phonePrefix ?? '+1'

  // Fetch all required data
  const [branches, academicYears, classes] = await Promise.all([
    prisma.branch.findMany({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    }),
    prisma.academicYear.findMany({
      where: {
        tenantId,
        state: { in: ['PLANNED', 'ACTIVE'] },
      },
      orderBy: { startDate: 'desc' },
    }),
    prisma.class.findMany({
      where: { tenantId },
      orderBy: { order: 'asc' },
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

      <div className="max-w-5xl mx-auto">
        <NewAdmissionForm
          branches={branches}
          academicYears={academicYears}
          phonePrefix={phonePrefix}
          classes={classes}
          enableCohorts={enableCohorts}
        />
      </div>
    </div>
  )
}

