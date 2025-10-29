'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'

// Get student with enrollment details
export async function getStudentWithEnrollments(id: string) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    const student = await prisma.student.findUnique({
      where: { id, tenantId },
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
                    stream: true,
                    branch: true,
                  },
                },
              },
            },
          },
        },
        courseEnrollments: {
          include: {
            course: true,
          },
        },
      },
    })

    if (!student) {
      return { success: false, error: 'Student not found' }
    }

    return { success: true, data: student }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to fetch student details' }
  }
}

// Delete student (with cascade delete of enrollments)
export async function deleteStudent(id: string, confirmed: boolean = false) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Check for enrollments
    const [studentEnrollmentCount, courseEnrollmentCount] = await Promise.all([
      prisma.studentEnrollment.count({
        where: { studentId: id, tenantId },
      }),
      prisma.courseEnrollment.count({
        where: { studentId: id, tenantId },
      }),
    ])

    const totalEnrollments = studentEnrollmentCount + courseEnrollmentCount

    // If enrollments exist and not confirmed, return enrollment info
    if (totalEnrollments > 0 && !confirmed) {
      return {
        success: false,
        needsConfirmation: true,
        enrollmentCount: {
          sections: studentEnrollmentCount,
          courses: courseEnrollmentCount,
          total: totalEnrollments,
        },
      }
    }

    // Delete student (cascade will handle enrollments)
    // Transaction to ensure all related data is deleted
    await prisma.$transaction(async (tx) => {
      // Get user ID before deleting student
      const student = await tx.student.findUnique({
        where: { id, tenantId },
        select: { userId: true },
      })

      if (!student) {
        throw new Error('Student not found')
      }

      // Delete student (cascade will delete enrollments)
      await tx.student.delete({
        where: { id, tenantId },
      })

      // Delete associated user
      await tx.user.delete({
        where: { id: student.userId, tenantId },
      })
    })

    revalidatePath('/students')
    revalidatePath('/academic-setup/sections')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to delete student' }
  }
}

