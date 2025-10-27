import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'
import { ThemeSettingsClient } from './client'
import { Palette } from 'lucide-react'

export default async function ThemeSettingsPage() {
  await requireRole('ADMIN')
  const tenantId = await getTenantId()
  
  const themeSettings = await prisma.themeSettings.findUnique({
    where: { tenantId }
  })
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-xl p-6 border border-neutral-200 bg-gradient-to-r from-violet-50 to-purple-50">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl shadow-md bg-gradient-to-br from-violet-500 to-purple-600">
            <Palette className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Theme Settings</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Customize your LMS appearance with predefined themes or create your own
            </p>
          </div>
        </div>
      </div>

      {/* Theme Settings Client Component */}
      <ThemeSettingsClient currentTheme={themeSettings} />
    </div>
  )
}

