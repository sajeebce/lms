import { getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import BundleCourseForm from './bundle-course-form'

export const metadata = {
  title: 'Create Bundle Course | LMS',
  description: 'Create a new bundle course',
}

export default async function CreateBundleCoursePage() {
  const tenantId = await getTenantId()

  const [categories, courses] = await Promise.all([
    prisma.courseCategory.findMany({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { order: 'asc' },
    }),
    prisma.course.findMany({
      where: {
        tenantId,
        courseType: 'SINGLE',
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        regularPrice: true,
        offerPrice: true,
        currency: true,
      },
      orderBy: { title: 'asc' },
    }),
  ])

  return <BundleCourseForm categories={categories} availableCourses={courses} />
}

