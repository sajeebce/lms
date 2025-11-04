import { getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import EditCourseForm from './edit-course-form'

export const metadata = {
  title: 'Edit Course | LMS',
  description: 'Edit course details',
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditCoursePage({ params }: Props) {
  const { id } = await params
  const tenantId = await getTenantId()

  const [course, categories] = await Promise.all([
    prisma.course.findFirst({
      where: { id, tenantId },
      include: {
        faqs: {
          orderBy: { order: 'asc' },
        },
      },
    }),
    prisma.courseCategory.findMany({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { order: 'asc' },
    }),
  ])

  if (!course) {
    notFound()
  }

  return <EditCourseForm course={course} categories={categories} />
}

