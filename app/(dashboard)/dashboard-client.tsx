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
    <div className="h-screen flex flex-col bg-background">
      {/* Sticky Header - Full Width, No Container */}
      <header className="sticky top-0 z-50 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-violet-600 dark:text-violet-400" />
            <div>
              <h1 className="text-xl font-bold text-card-foreground dark:text-white">LMS Admin</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-foreground/80 dark:text-slate-300">Admin User</span>
          </div>
        </div>
      </header>

      {/* Body - Full Width, No Gaps */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* Sidebar - Touch Header, Fixed Width */}
        <aside
          className="flex-shrink-0 h-full min-h-0 transition-all duration-300 border-r border-border dark:border-slate-700 bg-background dark:bg-slate-900 overflow-y-auto overscroll-y-contain"
          style={{
            width: isSidebarCollapsed ? '4rem' : 'clamp(240px, 280px, 280px)'
          }}
        >
          <SidebarNav
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </aside>

        {/* Toggle Button - Outside Sidebar */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute top-6 z-10 bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] border-2 border-white dark:border-slate-600 rounded-full p-1.5 hover:opacity-90 transition-all shadow-md hover:shadow-lg"
          style={{
            left: isSidebarCollapsed ? 'calc(4rem - 14px)' : 'calc(clamp(240px, 280px, 280px) - 14px)'
          }}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>

        {/* Main Content - Touch Sidebar, Flex Grow */}
        <main className="flex-1 min-w-0 h-full min-h-0 bg-background dark:bg-slate-950 overflow-y-auto overscroll-y-contain">
          <div className="p-4 md:p-6 max-w-[1600px]">
            {/* Breadcrumb in Body */}
            <Breadcrumb />

            {/* Page Content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

