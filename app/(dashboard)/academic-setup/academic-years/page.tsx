import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { AcademicYearsClient } from './academic-years-client'

export default async function AcademicYearsPage() {
  const tenantId = await getTenantId()

  const academicYears = await prisma.academicYear.findMany({
    where: { tenantId },
    orderBy: { startDate: 'desc' },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg p-6 border border-violet-100">
        <h1 className="text-2xl font-bold text-neutral-900">Academic Years</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Manage academic years and sessions
        </p>
      </div>

      {/* Content */}
      <AcademicYearsClient academicYears={academicYears} />
    </div>
  )
}

