'use client'

import { GraduationCap } from 'lucide-react'
import { SidebarNav } from '@/components/sidebar-nav'
import { Breadcrumb } from '@/components/breadcrumb'
import { useState } from 'react'

export function DashboardClient({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              <div>
                <h1 className="text-xl font-bold text-card-foreground">LMS Admin</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-foreground/80">Admin User</span>
            </div>
          </div>
        </div>
        {/* Breadcrumb Bar */}
        <div className="border-t border-border bg-muted/30">
          <div className="container mx-auto px-4 py-2">
            <Breadcrumb />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Golden Ratio: ~38.2% when expanded, ~5% when collapsed */}
          <aside
            className="flex-shrink-0 transition-all duration-300"
            style={{
              width: isSidebarCollapsed ? '4rem' : 'clamp(240px, 23.6%, 280px)'
            }}
          >
            <SidebarNav
              isCollapsed={isSidebarCollapsed}
              onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
          </aside>

          {/* Main Content - Golden Ratio: ~61.8% */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}

