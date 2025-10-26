import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { SectionTemplatesClient } from './section-templates-client'

export default async function SectionTemplatesPage() {
  const tenantId = await getTenantId()

  const [templates, classes] = await Promise.all([
    prisma.sectionTemplate.findMany({
      where: { tenantId },
      include: {
        class: true,
      },
      orderBy: [{ class: { order: 'asc' } }, { name: 'asc' }],
    }),
    prisma.class.findMany({
      where: { tenantId },
      orderBy: { order: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg p-6 border border-violet-100">
        <h1 className="text-2xl font-bold text-neutral-900">Section Templates</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Define section templates for automatic cohort generation
        </p>
      </div>
      <SectionTemplatesClient templates={templates} classes={classes} />
    </div>
  )
}

