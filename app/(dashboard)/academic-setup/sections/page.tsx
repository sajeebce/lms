import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { SectionsClient } from './sections-client'
import { PageHeader } from '@/components/page-header'
import { Grid3x3 } from 'lucide-react'

export default async function SectionsPage() {
  const tenantId = await getTenantId()

  const sections = await prisma.section.findMany({
    where: { tenantId },
    include: {
      cohort: {
        include: {
          year: true,
          class: true,
          branch: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
          routines: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sections"
        description="Manage independent sections for student enrollment"
        icon={Grid3x3}
        bgColor="bg-cyan-50"
        iconBgColor="bg-blue-600"
      />
      <SectionsClient sections={sections} />
    </div>
  )
}

