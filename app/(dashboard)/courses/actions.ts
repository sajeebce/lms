'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'

// Course schema
const courseSchema = z.object({
  name: z.string().min(1, 'Course name is required').max(100),
  code: z.string().min(1, 'Course code is required').max(20),
  description: z.string().optional(),
  credits: z.number().optional(),
})

export async function createCourse(data: z.infer<typeof courseSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = courseSchema.parse(data)

    // Check for duplicate code
    const existing = await prisma.course.findFirst({
      where: {
        tenantId,
        code: validated.code,
      },
    })

    if (existing) {
      return { success: false, error: 'Course with this code already exists' }
    }

    await prisma.course.create({
      data: {
        tenantId,
        ...validated,
      },
    })

    revalidatePath('/courses')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to create course' }
  }
}

export async function updateCourse(id: string, data: z.infer<typeof courseSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = courseSchema.parse(data)

    // Check for duplicate code (excluding current course)
    const existing = await prisma.course.findFirst({
      where: {
        tenantId,
        code: validated.code,
        id: { not: id },
      },
    })

    if (existing) {
      return { success: false, error: 'Course with this code already exists' }
    }

    await prisma.course.update({
      where: { id, tenantId },
      data: {
        ...validated,
      },
    })

    revalidatePath('/courses')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to update course' }
  }
}

export async function deleteCourse(id: string) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Check for course enrollments
    const enrollmentCount = await prisma.courseEnrollment.count({
      where: { courseId: id, tenantId },
    })

    if (enrollmentCount > 0) {
      return {
        success: false,
        error: `Cannot delete: ${enrollmentCount} student${enrollmentCount > 1 ? 's' : ''} enrolled`,
      }
    }

    await prisma.course.delete({
      where: { id, tenantId },
    })

    revalidatePath('/courses')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to delete course' }
  }
}

// Search students for enrollment
export async function searchStudents(query: string) {
  try {
    const tenantId = await getTenantId()

    const students = await prisma.student.findMany({
      where: {
        tenantId,
        OR: [
          { user: { name: { contains: query, mode: 'insensitive' } } },
          { user: { email: { contains: query, mode: 'insensitive' } } },
          { user: { phone: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        user: true,
        enrollments: {
          include: {
            section: {
              include: {
                cohort: {
                  include: {
                    year: true,
                    class: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 20,
    })

    return { success: true, data: students }
  } catch (error) {
    return { success: false, error: 'Failed to search students' }
  }
}

// Get students by filters (for cohorts disabled mode)
export async function getStudentsByFilters(
  yearId: string,
  classId: string,
  sectionId?: string,
  streamId?: string
) {
  try {
    const tenantId = await getTenantId()

    const students = await prisma.student.findMany({
      where: {
        tenantId,
        enrollments: {
          some: {
            section: {
              id: sectionId,
              cohort: {
                yearId,
                classId,
                streamId: streamId || undefined,
              },
            },
          },
        },
      },
      include: {
        user: true,
        enrollments: {
          include: {
            section: {
              include: {
                cohort: {
                  include: {
                    year: true,
                    class: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    return { success: true, data: students }
  } catch (error) {
    return { success: false, error: 'Failed to fetch students' }
  }
}

// Enroll students in course
export async function enrollStudentsInCourse(
  courseId: string,
  studentIds: string[]
) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return { success: false, error: 'Course not found' }
    }

    // Enroll students
    let enrolledCount = 0
    let skippedCount = 0

    for (const studentId of studentIds) {
      const existing = await prisma.courseEnrollment.findFirst({
        where: {
          tenantId,
          studentId,
          courseId,
        },
      })

      if (existing) {
        skippedCount++
        continue
      }

      await prisma.courseEnrollment.create({
        data: {
          tenantId,
          studentId,
          courseId,
          status: 'ACTIVE',
        },
      })

      enrolledCount++
    }

    revalidatePath('/courses')
    return {
      success: true,
      stats: { enrolledCount, skippedCount },
    }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to enroll students' }
  }
}

