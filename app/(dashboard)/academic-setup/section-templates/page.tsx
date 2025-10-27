import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { SectionTemplatesClient } from './section-templates-client'
import { PageHeader } from '@/components/page-header'
import { FileText } from 'lucide-react'

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
      <PageHeader
        title="Section Templates"
        description="Define section templates for automatic cohort generation"
        icon={FileText}
        bgColor="bg-violet-50"
        iconBgColor="bg-violet-600"
      />
      <SectionTemplatesClient templates={templates} classes={classes} />
    </div>
  )
}

