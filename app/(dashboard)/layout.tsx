import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { DashboardClient } from './dashboard-client'
import { ThemeProvider } from './theme-provider'
import { convertToDarkHover, darkenBorder } from '@/lib/theme-utils'

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

  // Auto-generate dark mode colors from light mode colors
  // Light mode: Use original colors from database
  // Dark mode: Convert light backgrounds to dark backgrounds
  const hoverFrom = isDarkMode
    ? convertToDarkHover(theme.hoverFrom)
    : theme.hoverFrom

  const hoverTo = isDarkMode
    ? convertToDarkHover(theme.hoverTo)
    : theme.hoverTo

  const borderColor = isDarkMode
    ? darkenBorder(theme.borderColor)
    : theme.borderColor

  // Calculate hover text color
  // If custom hoverTextColor is set, use it
  // Otherwise, use white for dark mode (maximum contrast), theme color for light mode
  const hoverTextColor = theme.hoverTextColor ||
    (isDarkMode ? '#ffffff' : theme.activeFrom)

  return (
    <>
      {/* Inject theme CSS variables */}
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --theme-active-from: ${theme.activeFrom};
            --theme-active-to: ${theme.activeTo};
            --theme-hover-from: ${hoverFrom};
            --theme-hover-to: ${hoverTo};
            --theme-border: ${borderColor};
            --theme-button-from: ${theme.buttonFrom};
            --theme-button-to: ${theme.buttonTo};
            --theme-hover-text: ${hoverTextColor};
          }
        `
      }} />
      <ThemeProvider mode={theme.mode}>
        <DashboardClient>{children}</DashboardClient>
      </ThemeProvider>
    </>
  )
}

