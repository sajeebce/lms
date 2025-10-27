import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { SectionsClient } from './sections-client'
import { PageHeader } from '@/components/page-header'
import { Grid3x3 } from 'lucide-react'

export default async function SectionsPage() {
  const tenantId = await getTenantId()

  const [sections, branches, academicYears, classes, cohorts] = await Promise.all([
    prisma.section.findMany({
      where: { tenantId },
      include: {
        cohort: {
          include: {
            year: true,
            class: true,
            branch: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
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
    prisma.cohort.findMany({
      where: { tenantId },
      include: {
        year: true,
        class: true,
        branch: true,
      },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sections"
        description="Manage sections within classes"
        icon={Grid3x3}
        bgColor="bg-cyan-50"
        iconBgColor="bg-blue-600"
      />
      <SectionsClient
        sections={sections}
        branches={branches}
        academicYears={academicYears}
        classes={classes}
        cohorts={cohorts}
      />
    </div>
  )
}

