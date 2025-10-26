import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { CohortsClient } from './cohorts-client'

export default async function CohortsPage() {
  const tenantId = await getTenantId()

  const [cohorts, branches, academicYears, classes] = await Promise.all([
    prisma.cohort.findMany({
      where: { tenantId },
      include: {
        year: true,
        class: true,
        branch: true,
        _count: {
          select: { sections: true },
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
  ])

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg p-6 border border-violet-100">
        <h1 className="text-2xl font-bold text-neutral-900">Cohorts</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Manage student cohorts and enrollment
        </p>
      </div>
      <CohortsClient
        cohorts={cohorts}
        branches={branches}
        academicYears={academicYears}
        classes={classes}
      />
    </div>
  )
}

