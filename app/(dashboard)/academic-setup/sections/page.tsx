import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { SectionsClient } from './sections-client'

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
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg p-6 border border-violet-100">
        <h1 className="text-2xl font-bold text-neutral-900">Sections</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Manage cohort sections and student assignments
        </p>
      </div>
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

