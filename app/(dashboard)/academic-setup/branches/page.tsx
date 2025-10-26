import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { BranchesClient } from './branches-client'

export default async function BranchesPage() {
  const tenantId = await getTenantId()

  const branches = await prisma.branch.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg p-6 border border-violet-100">
        <h1 className="text-2xl font-bold text-neutral-900">Branches</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Manage school branches and locations
        </p>
      </div>

      {/* Content */}
      <BranchesClient branches={branches} />
    </div>
  )
}

