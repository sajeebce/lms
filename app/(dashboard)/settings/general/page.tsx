import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { GeneralSettingsClient } from './general-settings-client'
import { PageHeader } from '@/components/page-header'
import { Building2 } from 'lucide-react'

export default async function GeneralSettingsPage() {
  const tenantId = await getTenantId()

  // Fetch or create tenant settings
  let settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  })

  // If no settings exist, create default settings
  if (!settings) {
    settings = await prisma.tenantSettings.create({
      data: {
        tenantId,
        enableCohorts: true,
        instituteName: null,
        logoUrl: null,
        signatureUrl: null,
        currencyName: 'USD',
        currencySymbol: '$',
        countryCode: 'US',
        phonePrefix: '+1',
        emailEnabled: false,
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="General Settings"
        description="Configure institute name, logo, signature, currency, and country settings"
        icon={Building2}
        bgColor="bg-blue-50"
        iconBgColor="bg-blue-600"
      />
      <GeneralSettingsClient settings={settings} />
    </div>
  )
}

