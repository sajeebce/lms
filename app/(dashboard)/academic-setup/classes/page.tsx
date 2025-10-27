import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { ClassesClient } from './classes-client'
import { PageHeader } from '@/components/page-header'
import { Layers } from 'lucide-react'

export default async function ClassesPage() {
  const tenantId = await getTenantId()

  const [classes, streams] = await Promise.all([
    prisma.class.findMany({
      where: { tenantId },
      include: {
        stream: true,
        _count: {
          select: {
            cohorts: true,
            sectionTemplates: true,
          },
        },
      },
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
        title="Classes / Grades"
        description="Manage academic classes and grade levels"
        icon={Layers}
        bgColor="bg-blue-50"
        iconBgColor="bg-blue-600"
      />
      <ClassesClient classes={classes} streams={streams} />
    </div>
  )
}

