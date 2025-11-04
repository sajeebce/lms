'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export function Breadcrumb() {
  const pathname = usePathname()
  const [studentUsername, setStudentUsername] = useState<string | null>(null)

  // Generate breadcrumb items from pathname
  const pathSegments = pathname.split('/').filter(Boolean)

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
  ]

  // Map path segments to readable labels
  const labelMap: Record<string, string> = {
    'academic-setup': 'Academic Setup',
    'branches': 'Branches',
    'academic-years': 'Academic Years',
    'streams': 'Streams',
    'classes': 'Classes',
    'cohorts': 'Cohorts',
    'section-templates': 'Section Templates',
    'sections': 'Sections',
    'routine': 'Routine',
    'year-wizard': 'Year Wizard',
    'promotions': 'Promotions',
    'students': 'Students',
    'admission': 'Admit Student',
    'reports': 'Reports & Analytics',
    'settings': 'Settings',
    'academic': 'Academic Settings',
    'course-management': 'Course Management',
    'categories': 'Categories',
    'courses': 'Courses',
    'new': 'Create New',
    'create': 'Create',
    'single': 'Single Course',
    'bundle': 'Bundle Course',
    'edit': 'Edit',
  }

  // Paths that don't have their own pages (parent-only routes)
  // These will be skipped in breadcrumb to avoid 404 errors
  const skipPaths = ['academic-setup', 'course-management', 'create']

  // Fetch student username if this is a student profile page
  useEffect(() => {
    if (pathSegments[0] === 'students' && pathSegments[1] && pathSegments[1] !== 'admission') {
      const studentId = pathSegments[1]
      // Fetch student data to get username
      fetch(`/api/students/${studentId}`)
        .then(res => res.json())
        .then(data => {
          if (data.user?.username) {
            setStudentUsername(data.user.username)
          }
        })
        .catch(() => {
          // Silently fail, breadcrumb will show ID
        })
    }
  }, [pathSegments])

  // Build breadcrumb path
  let currentPath = ''
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`

    // Skip parent-only paths that don't have actual pages
    if (skipPaths.includes(segment)) {
      return
    }

    // For student profile pages, use username instead of ID
    let label = labelMap[segment]
    if (!label) {
      if (pathSegments[0] === 'students' && index === 1 && studentUsername) {
        label = studentUsername
      } else {
        label = segment.charAt(0).toUpperCase() + segment.slice(1)
      }
    }
    breadcrumbItems.push({ label, href: currentPath })
  })

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1

        return (
          <div key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/60" />
            )}
            {isLast ? (
              <span className="font-medium text-foreground">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

