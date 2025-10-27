import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { StreamsClient } from './streams-client'
import { PageHeader } from '@/components/page-header'
import { BookOpen } from 'lucide-react'

export default async function StreamsPage() {
  const tenantId = await getTenantId()

  const streams = await prisma.stream.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: { classes: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Streams / Departments"
        description="Manage academic streams and departments"
        icon={BookOpen}
        bgColor="bg-amber-50"
        iconBgColor="bg-amber-600"
      />
      <StreamsClient streams={streams} />
    </div>
  )
}

