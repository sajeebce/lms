import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { StorageSettingsClient } from './storage-settings-client'
import { PageHeader } from '@/components/page-header'
import { HardDrive } from 'lucide-react'

export default async function StorageSettingsPage() {
  const tenantId = await getTenantId()

  let settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  })

  if (!settings) {
    settings = await prisma.tenantSettings.create({
      data: {
        tenantId,
        enableCohorts: true,
        emailEnabled: false,
        storageType: 'LOCAL',
        storageLocalPath: './storage',
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Storage Settings"
        description="Configure file storage provider (Local or Cloudflare R2)"
        icon={HardDrive}
        bgColor="bg-cyan-50"
        iconBgColor="bg-cyan-600"
      />
      <StorageSettingsClient settings={settings} />
    </div>
  )
}

