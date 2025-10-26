import Link from 'next/link'
import { GraduationCap, BookOpen, Users, Calendar, Settings } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-violet-600" />
              <h1 className="text-2xl font-bold text-neutral-900">LMS</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-600">Admin User</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="space-y-1">
                <Link
                  href="/academic-setup/branches"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-700 rounded-md hover:bg-violet-50 hover:text-violet-700 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Branches
                </Link>
                <Link
                  href="/academic-setup/academic-years"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-700 rounded-md hover:bg-violet-50 hover:text-violet-700 transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  Academic Years
                </Link>
                <Link
                  href="/academic-setup/streams"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-700 rounded-md hover:bg-violet-50 hover:text-violet-700 transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  Streams
                </Link>
                <Link
                  href="/academic-setup/classes"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-700 rounded-md hover:bg-violet-50 hover:text-violet-700 transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  Classes
                </Link>
                <Link
                  href="/academic-setup/cohorts"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-700 rounded-md hover:bg-violet-50 hover:text-violet-700 transition-colors"
                >
                  <Users className="h-4 w-4" />
                  Cohorts
                </Link>
                <Link
                  href="/academic-setup/section-templates"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-700 rounded-md hover:bg-violet-50 hover:text-violet-700 transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  Section Templates
                </Link>
                <Link
                  href="/academic-setup/sections"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-700 rounded-md hover:bg-violet-50 hover:text-violet-700 transition-colors"
                >
                  <Users className="h-4 w-4" />
                  Sections
                </Link>
                <Link
                  href="/academic-setup/routine"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-700 rounded-md hover:bg-violet-50 hover:text-violet-700 transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  Routine
                </Link>
                <Link
                  href="/academic-setup/year-wizard"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-700 rounded-md hover:bg-violet-50 hover:text-violet-700 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Year Wizard
                </Link>
                <Link
                  href="/academic-setup/promotions"
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-700 rounded-md hover:bg-violet-50 hover:text-violet-700 transition-colors"
                >
                  <Users className="h-4 w-4" />
                  Promotions
                </Link>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}

