import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { CohortsClient } from './cohorts-client'
import { PageHeader } from '@/components/page-header'
import { Users } from 'lucide-react'

export default async function CohortsPage() {
  const tenantId = await getTenantId()

  const [cohorts, branches, academicYears, classes, streams] = await Promise.all([
    prisma.cohort.findMany({
      where: { tenantId },
      include: {
        year: true,
        class: true,
        stream: true,
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
    prisma.stream.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cohorts"
        description="Manage student cohorts by year and class"
        icon={Users}
        bgColor="bg-pink-50"
        iconBgColor="bg-pink-600"
      />
      <CohortsClient
        cohorts={cohorts}
        branches={branches}
        academicYears={academicYears}
        classes={classes}
        streams={streams}
      />
    </div>
  )
}

