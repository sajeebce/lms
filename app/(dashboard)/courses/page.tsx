import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'
import { PageHeader } from '@/components/page-header'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CoursesClient } from './courses-client'

export default async function CoursesPage() {
  await requireRole('ADMIN')
  const tenantId = await getTenantId()

  // Fetch tenant settings
  const tenantSettings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  })
  const enableCohorts = tenantSettings?.enableCohorts ?? true

  // Fetch all data
  const [courses, academicYears, classes, sections, branches, cohorts] = await Promise.all([
    prisma.course.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.academicYear.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
    }),
    prisma.class.findMany({
      where: { tenantId },
      orderBy: { order: 'asc' },
    }),
    prisma.section.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    }),
    prisma.branch.findMany({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    }),
    prisma.cohort.findMany({
      where: { tenantId, enrollmentOpen: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Manage courses and student enrollments"
        icon={BookOpen}
        bgColor="bg-amber-50"
        iconBgColor="bg-amber-600"
      />

      <CoursesClient
        courses={courses}
        academicYears={academicYears}
        classes={classes}
        sections={sections}
        branches={branches}
        cohorts={cohorts}
        enableCohorts={enableCohorts}
      />
    </div>
  )
}

