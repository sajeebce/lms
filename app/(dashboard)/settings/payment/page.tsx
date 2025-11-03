import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { PaymentSettingsClient } from './payment-settings-client'
import { PageHeader } from '@/components/page-header'
import { CreditCard } from 'lucide-react'

export default async function PaymentSettingsPage() {
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
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Methods"
        description="Configure payment gateways for online fee collection"
        icon={CreditCard}
        bgColor="bg-amber-50"
        iconBgColor="bg-amber-600"
      />
      <PaymentSettingsClient settings={settings} />
    </div>
  )
}

