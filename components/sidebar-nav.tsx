'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  GraduationCap,
  BookOpen,
  Users,
  Calendar,
  Settings,
  ChevronDown,
  LayoutDashboard,
  FileText,
  Layers,
  Wand2,
  ArrowRight,
  BarChart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface SidebarNavProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function SidebarNav({ isCollapsed, onToggle }: SidebarNavProps) {
  const pathname = usePathname()
  const isAcademicSetupActive = pathname.startsWith('/academic-setup')
  const [isAcademicSetupOpen, setIsAcademicSetupOpen] = useState(isAcademicSetupActive)

  const academicSetupItems = [
    {
      href: '/academic-setup/branches',
      label: 'Branches',
      icon: Settings,
    },
    {
      href: '/academic-setup/academic-years',
      label: 'Academic Years',
      icon: Calendar,
    },
    {
      href: '/academic-setup/streams',
      label: 'Streams',
      icon: BookOpen,
    },
    {
      href: '/academic-setup/classes',
      label: 'Classes / Grades',
      icon: Layers,
    },
    {
      href: '/academic-setup/cohorts',
      label: 'Cohorts',
      icon: Users,
    },
    {
      href: '/academic-setup/section-templates',
      label: 'Section Templates',
      icon: FileText,
    },
    {
      href: '/academic-setup/sections',
      label: 'Sections',
      icon: BookOpen,
    },
    {
      href: '/academic-setup/routine',
      label: 'Routine',
      icon: Calendar,
    },
    {
      href: '/academic-setup/year-wizard',
      label: 'Year Wizard',
      icon: Wand2,
    },
    {
      href: '/academic-setup/promotions',
      label: 'Promotions',
      icon: ArrowRight,
    },
  ]

  return (
    <nav className="bg-gradient-to-br from-white to-violet-50/30 rounded-xl border border-violet-100 shadow-lg p-4 relative">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 z-10 bg-gradient-to-r from-pink-500 to-orange-500 border-2 border-white rounded-full p-1.5 hover:from-pink-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-white" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5 text-white" />
        )}
      </button>

      <div className="space-y-1">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all group',
            pathname === '/dashboard'
              ? 'bg-gradient-to-r from-[var(--theme-active-from)] to-[var(--theme-active-to)] text-white shadow-md'
              : 'text-foreground hover:bg-gradient-to-r hover:from-[var(--theme-hover-from)] hover:to-[var(--theme-hover-to)] hover:text-[var(--theme-hover-text)]',
            isCollapsed && 'justify-center'
          )}
          title={isCollapsed ? 'Dashboard' : ''}
        >
          <div className={cn(
            'p-1.5 rounded-md',
            pathname === '/dashboard'
              ? 'bg-white/20'
              : 'bg-gradient-to-br from-blue-400 to-indigo-500 group-hover:from-blue-500 group-hover:to-indigo-600'
          )}>
            <LayoutDashboard className="h-4 w-4 flex-shrink-0 text-white" />
          </div>
          {!isCollapsed && <span>Dashboard</span>}
        </Link>

        {/* Student Management - Collapsible */}
        {isCollapsed ? (
          <Link
            href="/students"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all group justify-center',
              pathname === '/students'
                ? 'bg-gradient-to-r from-[var(--theme-active-from)] to-[var(--theme-active-to)] text-white shadow-md'
                : 'text-foreground hover:bg-gradient-to-r hover:from-[var(--theme-hover-from)] hover:to-[var(--theme-hover-to)] hover:text-[var(--theme-hover-text)]'
            )}
            title="Student Management"
          >
            <div className={cn(
              'p-1.5 rounded-md',
              pathname === '/students'
                ? 'bg-white/20'
                : 'bg-gradient-to-br from-emerald-400 to-teal-500 group-hover:from-emerald-500 group-hover:to-teal-600'
            )}>
              <Users className="h-4 w-4 flex-shrink-0 text-white" />
            </div>
          </Link>
        ) : (
          <Collapsible open={false}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-foreground rounded-lg hover:bg-gradient-to-r hover:from-[var(--theme-hover-from)] hover:to-[var(--theme-hover-to)] hover:text-[var(--theme-hover-text)] transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 group-hover:from-emerald-500 group-hover:to-teal-600">
                  <Users className="h-4 w-4 flex-shrink-0 text-white" />
                </div>
                <span>Student Management</span>
              </div>
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-3 mt-1 space-y-1 border-l-2 border-[var(--theme-border)] pl-3">
              <Link
                href="/students"
                className={cn(
                  'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all group',
                  pathname === '/students'
                    ? 'bg-gradient-to-r from-[var(--theme-active-from)] to-[var(--theme-active-to)] text-white shadow-md'
                    : 'text-foreground hover:bg-gradient-to-r hover:from-[var(--theme-hover-from)] hover:to-[var(--theme-hover-to)] hover:text-[var(--theme-hover-text)]'
                )}
              >
                <div className={cn(
                  'p-1.5 rounded-md',
                  pathname === '/students'
                    ? 'bg-white/20'
                    : 'bg-gradient-to-br from-emerald-400 to-teal-500 group-hover:from-emerald-500 group-hover:to-teal-600'
                )}>
                  <Users className="h-4 w-4 flex-shrink-0 text-white" />
                </div>
                <span>Student List</span>
              </Link>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Academic Setup - Collapsible */}
        {isCollapsed ? (
          <Link
            href="/academic-setup/branches"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all group justify-center',
              isAcademicSetupActive
                ? 'bg-gradient-to-r from-[var(--theme-active-from)] to-[var(--theme-active-to)] text-white shadow-md'
                : 'text-foreground hover:bg-gradient-to-r hover:from-[var(--theme-hover-from)] hover:to-[var(--theme-hover-to)] hover:text-[var(--theme-hover-text)]'
            )}
            title="Academic Setup"
          >
            <div className={cn(
              'p-1.5 rounded-md',
              isAcademicSetupActive
                ? 'bg-white/20'
                : 'bg-gradient-to-br from-violet-400 to-purple-500 group-hover:from-violet-500 group-hover:to-purple-600'
            )}>
              <Settings className="h-4 w-4 flex-shrink-0 text-white" />
            </div>
          </Link>
        ) : (
          <Collapsible open={isAcademicSetupOpen} onOpenChange={setIsAcademicSetupOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-foreground rounded-lg hover:bg-gradient-to-r hover:from-[var(--theme-hover-from)] hover:to-[var(--theme-hover-to)] hover:text-[var(--theme-hover-text)] transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-violet-400 to-purple-500 group-hover:from-violet-500 group-hover:to-purple-600">
                  <Settings className="h-4 w-4 flex-shrink-0 text-white" />
                </div>
                <span>Academic Setup</span>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  isAcademicSetupOpen && 'rotate-180'
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-3 mt-1 space-y-1 border-l-2 border-[var(--theme-border)] pl-3">
              {academicSetupItems.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                // Different gradient colors for each item
                const gradients = [
                  'from-red-400 to-pink-500',
                  'from-orange-400 to-amber-500',
                  'from-yellow-400 to-orange-500',
                  'from-lime-400 to-green-500',
                  'from-emerald-400 to-teal-500',
                  'from-cyan-400 to-blue-500',
                  'from-sky-400 to-indigo-500',
                  'from-indigo-400 to-purple-500',
                  'from-violet-400 to-fuchsia-500',
                  'from-fuchsia-400 to-pink-500',
                ]
                const hoverGradients = [
                  'from-red-500 to-pink-600',
                  'from-orange-500 to-amber-600',
                  'from-yellow-500 to-orange-600',
                  'from-lime-500 to-green-600',
                  'from-emerald-500 to-teal-600',
                  'from-cyan-500 to-blue-600',
                  'from-sky-500 to-indigo-600',
                  'from-indigo-500 to-purple-600',
                  'from-violet-500 to-fuchsia-600',
                  'from-fuchsia-500 to-pink-600',
                ]

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all group',
                      isActive
                        ? 'bg-gradient-to-r from-[var(--theme-active-from)] to-[var(--theme-active-to)] text-white shadow-md'
                        : 'text-foreground hover:bg-gradient-to-r hover:from-[var(--theme-hover-from)] hover:to-[var(--theme-hover-to)] hover:text-[var(--theme-hover-text)]'
                    )}
                  >
                    <div className={cn(
                      'p-1.5 rounded-md bg-gradient-to-br transition-all',
                      isActive
                        ? 'bg-white/20'
                        : `${gradients[index]} group-hover:${hoverGradients[index]}`
                    )}>
                      <Icon className="h-4 w-4 flex-shrink-0 text-white" />
                    </div>
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Reports & Analytics */}
        <Link
          href="/reports"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all group',
            pathname === '/reports'
              ? 'bg-gradient-to-r from-[var(--theme-active-from)] to-[var(--theme-active-to)] text-white shadow-md'
              : 'text-foreground hover:bg-gradient-to-r hover:from-[var(--theme-hover-from)] hover:to-[var(--theme-hover-to)] hover:text-[var(--theme-hover-text)]',
            isCollapsed && 'justify-center'
          )}
          title={isCollapsed ? 'Reports & Analytics' : ''}
        >
          <div className={cn(
            'p-1.5 rounded-md',
            pathname === '/reports'
              ? 'bg-white/20'
              : 'bg-gradient-to-br from-amber-400 to-orange-500 group-hover:from-amber-500 group-hover:to-orange-600'
          )}>
            <BarChart className="h-4 w-4 flex-shrink-0 text-white" />
          </div>
          {!isCollapsed && <span>Reports & Analytics</span>}
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all group',
            pathname.startsWith('/settings')
              ? 'bg-gradient-to-r from-[var(--theme-active-from)] to-[var(--theme-active-to)] text-white shadow-md'
              : 'text-foreground hover:bg-gradient-to-r hover:from-[var(--theme-hover-from)] hover:to-[var(--theme-hover-to)] hover:text-[var(--theme-hover-text)]',
            isCollapsed && 'justify-center'
          )}
          title={isCollapsed ? 'Settings' : ''}
        >
          <div className={cn(
            'p-1.5 rounded-md',
            pathname.startsWith('/settings')
              ? 'bg-white/20'
              : 'bg-gradient-to-br from-slate-400 to-gray-500 group-hover:from-slate-500 group-hover:to-gray-600'
          )}>
            <Settings className="h-4 w-4 flex-shrink-0 text-white" />
          </div>
          {!isCollapsed && <span>Settings</span>}
        </Link>
      </div>
    </nav>
  )
}

