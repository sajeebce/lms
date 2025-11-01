import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { EmailSettingsClient } from './email-settings-client'
import { PageHeader } from '@/components/page-header'
import { Mail } from 'lucide-react'

export default async function EmailSettingsPage() {
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
        storageProvider: 'local',
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Settings"
        description="Configure email carrier (SMTP) and email templates for automated notifications"
        icon={Mail}
        bgColor="bg-emerald-50"
        iconBgColor="bg-emerald-600"
      />
      <EmailSettingsClient settings={settings} />
    </div>
  )
}

