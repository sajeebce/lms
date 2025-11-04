'use server'

import { requireRole, getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function deleteCourse(id: string) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Check if course has enrollments
    const course = await prisma.course.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    })

    if (!course) {
      return { success: false, error: 'Course not found' }
    }

    if (course._count.enrollments > 0) {
      return {
        success: false,
        error: `Cannot delete course with ${course._count.enrollments} active enrollments`,
      }
    }

    // Delete course (cascade will delete topics, lessons, FAQs)
    await prisma.course.delete({
      where: { id },
    })

    revalidatePath('/course-management/courses')
    return { success: true }
  } catch (error) {
    console.error('Delete course error:', error)
    return { success: false, error: 'Failed to delete course' }
  }
}

