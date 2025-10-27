import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { DashboardClient } from './dashboard-client'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenantId = await getTenantId()

  // Load tenant's theme settings
  const themeSettings = await prisma.themeSettings.findUnique({
    where: { tenantId }
  })

  // Default theme if not set
  const theme = themeSettings || {
    activeFrom: '#ec4899',
    activeTo: '#f97316',
    hoverFrom: '#fdf2f8',
    hoverTo: '#fff7ed',
    borderColor: '#fbcfe8',
    buttonFrom: '#ec4899',
    buttonTo: '#f97316',
  }

  return (
    <>
      {/* Inject theme CSS variables */}
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --theme-active-from: ${theme.activeFrom};
            --theme-active-to: ${theme.activeTo};
            --theme-hover-from: ${theme.hoverFrom};
            --theme-hover-to: ${theme.hoverTo};
            --theme-border: ${theme.borderColor};
            --theme-button-from: ${theme.buttonFrom};
            --theme-button-to: ${theme.buttonTo};
          }
        `
      }} />
      <DashboardClient>{children}</DashboardClient>
    </>
  )
}

