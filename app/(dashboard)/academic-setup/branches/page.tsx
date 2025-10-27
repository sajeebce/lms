import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { BranchesClient } from './branches-client'
import { PageHeader } from '@/components/page-header'
import { Building2 } from 'lucide-react'

export default async function BranchesPage() {
  const tenantId = await getTenantId()

  const branches = await prisma.branch.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Branches"
        description="Manage school branches and locations"
        icon={Building2}
        bgColor="bg-violet-50"
        iconBgColor="bg-violet-600"
      />

      {/* Content */}
      <BranchesClient branches={branches} />
    </div>
  )
}

