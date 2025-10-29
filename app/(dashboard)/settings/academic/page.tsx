import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'
import { PageHeader } from '@/components/page-header'
import { Settings } from 'lucide-react'
import { AcademicSettingsClient } from './academic-settings-client'

export default async function AcademicSettingsPage() {
  await requireRole('ADMIN')
  const tenantId = await getTenantId()

  // Fetch tenant settings
  const tenantSettings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  })

  const enableCohorts = tenantSettings?.enableCohorts ?? true

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Settings"
        description="Configure academic setup preferences"
        icon={Settings}
        bgColor="bg-purple-50"
        iconBgColor="bg-purple-600"
      />

      <AcademicSettingsClient enableCohorts={enableCohorts} />
    </div>
  )
}

