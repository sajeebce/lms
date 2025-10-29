import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { AcademicYearsClient } from './academic-years-client'
import { PageHeader } from '@/components/page-header'
import { Calendar } from 'lucide-react'

export default async function AcademicYearsPage() {
  const tenantId = await getTenantId()

  const academicYears = await prisma.academicYear.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: {
          cohorts: true,
        },
      },
    },
    orderBy: { startDate: 'desc' },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Academic Years"
        description="Manage academic years and sessions"
        icon={Calendar}
        bgColor="bg-emerald-50"
        iconBgColor="bg-emerald-600"
      />

      {/* Content */}
      <AcademicYearsClient academicYears={academicYears} />
    </div>
  )
}

