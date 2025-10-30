import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { YearWizardClient } from './year-wizard-client'
import { PageHeader } from '@/components/page-header'
import { Wand2 } from 'lucide-react'

export default async function YearWizardPage() {
  const tenantId = await getTenantId()

  const [branches, academicYears, classes, streams, sections] = await Promise.all([
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
    prisma.stream.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    }),
    prisma.section.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Year Wizard"
        description="Bulk create cohorts and sections for a new academic year"
        icon={Wand2}
        bgColor="bg-violet-50"
        iconBgColor="bg-violet-600"
      />
      <YearWizardClient
        branches={branches}
        academicYears={academicYears}
        classes={classes}
        streams={streams}
        sections={sections}
      />
    </div>
  )
}

