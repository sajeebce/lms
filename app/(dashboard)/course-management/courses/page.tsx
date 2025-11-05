import { getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSubjects } from '@/lib/actions/subject.actions'
import { getClasses } from '@/lib/actions/class.actions'
import { getStreams } from '@/lib/actions/stream.actions'
import CoursesClient from './courses-client'
import { PageHeader } from '@/components/page-header'
import { BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Courses | LMS',
  description: 'Manage courses',
}

export default async function CoursesPage() {
  const tenantId = await getTenantId()

  const [courses, categories, subjects, classes, streams] = await Promise.all([
    prisma.course.findMany({
      where: { tenantId },
      include: {
        category: true,
        class: true,
        subject: true,
        stream: true,
        _count: {
          select: {
            enrollments: true,
            topics: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.courseCategory.findMany({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { order: 'asc' },
    }),
    getSubjects({ status: 'ACTIVE' }),
    getClasses(),
    getStreams(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Manage your course catalog"
        icon={BookOpen}
        bgColor="bg-violet-50"
        iconBgColor="bg-violet-600"
      />
      <CoursesClient
        courses={courses}
        categories={categories}
        subjects={subjects}
        classes={classes}
        streams={streams}
      />
    </div>
  )
}

