import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { YearWizardClient } from './year-wizard-client'

export default async function YearWizardPage() {
  const tenantId = await getTenantId()

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

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg p-6 border border-violet-100">
        <h1 className="text-2xl font-bold text-neutral-900">Year Wizard 🪄</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Bulk create cohorts and sections for a new academic year
        </p>
      </div>
      <YearWizardClient
        branches={branches}
        academicYears={academicYears}
        classes={classes}
      />
    </div>
  )
}

