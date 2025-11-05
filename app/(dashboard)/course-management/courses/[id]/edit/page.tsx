import { getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getSubjects } from '@/lib/actions/subject.actions'
import { getClasses } from '@/lib/actions/class.actions'
import { getStreams } from '@/lib/actions/stream.actions'
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

  const [course, categories, subjects, classes, streams] = await Promise.all([
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
    getSubjects({ status: 'ACTIVE' }),
    getClasses(),
    getStreams(),
  ])

  if (!course) {
    notFound()
  }

  return (
    <EditCourseForm
      course={course}
      categories={categories}
      subjects={subjects}
      classes={classes}
      streams={streams}
    />
  )
}

