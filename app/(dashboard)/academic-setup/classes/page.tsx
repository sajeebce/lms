import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { ClassesClient } from './classes-client'

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
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg p-6 border border-violet-100">
        <h1 className="text-2xl font-bold text-neutral-900">Classes</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Manage academic classes and grade levels
        </p>
      </div>
      <ClassesClient classes={classes} streams={streams} />
    </div>
  )
}

