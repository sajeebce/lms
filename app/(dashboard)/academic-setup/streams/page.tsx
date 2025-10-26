import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { StreamsClient } from './streams-client'

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
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg p-6 border border-violet-100">
        <h1 className="text-2xl font-bold text-neutral-900">Streams</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Manage academic streams and departments
        </p>
      </div>
      <StreamsClient streams={streams} />
    </div>
  )
}

