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
    mode: 'light',
    activeFrom: '#ec4899',
    activeTo: '#f97316',
    hoverFrom: '#fdf2f8',
    hoverTo: '#fff7ed',
    borderColor: '#fbcfe8',
    buttonFrom: '#ec4899',
    buttonTo: '#f97316',
    hoverTextColor: null,
  }

  // Determine if dark mode should be applied
  const isDarkMode = theme.mode === 'dark'

  // Calculate hover text color
  // If custom hoverTextColor is set, use it
  // Otherwise, use bright accent color for dark mode, dark color for light mode
  const hoverTextColor = theme.hoverTextColor ||
    (isDarkMode ? '#f1f5f9' : theme.activeFrom)

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
            --theme-hover-text: ${hoverTextColor};
          }
        `
      }} />
      <div className={isDarkMode ? 'dark' : ''}>
        <DashboardClient>{children}</DashboardClient>
      </div>
    </>
  )
}

