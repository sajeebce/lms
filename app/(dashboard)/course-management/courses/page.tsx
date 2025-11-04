import { getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import CoursesClient from './courses-client'

export const metadata = {
  title: 'Courses | LMS',
  description: 'Manage courses',
}

export default async function CoursesPage() {
  const tenantId = await getTenantId()

  const [courses, categories] = await Promise.all([
    prisma.course.findMany({
      where: { tenantId },
      include: {
        category: true,
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
  ])

  return <CoursesClient courses={courses} categories={categories} />
}

