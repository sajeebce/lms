'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'

const cohortSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  yearId: z.string().min(1, 'Academic year is required'),
  classId: z.string().min(1, 'Class is required'),
  streamId: z.string().optional(),
  branchId: z.string().min(1, 'Branch is required'),
  sectionId: z.string().optional(), // Optional section to link
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED']),
  enrollmentOpen: z.boolean(),
  startDate: z.string().optional(),
})

export async function createCohort(data: z.infer<typeof cohortSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = cohortSchema.parse(data)

    // Check for duplicate
    const existing = await prisma.cohort.findFirst({
      where: {
        tenantId,
        yearId: validated.yearId,
        classId: validated.classId,
        streamId: validated.streamId || null,
        branchId: validated.branchId,
        name: validated.name,
      },
    })

    if (existing) {
      return { success: false, error: 'Cohort with this combination already exists' }
    }

    // Use transaction to create cohort and link section if provided
    await prisma.$transaction(async (tx) => {
      const cohort = await tx.cohort.create({
        data: {
          name: validated.name,
          yearId: validated.yearId,
          classId: validated.classId,
          streamId: validated.streamId || null,
          branchId: validated.branchId,
          status: validated.status,
          enrollmentOpen: validated.enrollmentOpen,
          startDate: validated.startDate ? new Date(validated.startDate) : null,
          tenantId,
        },
      })

      // If section selected, link it to this cohort via junction table
      if (validated.sectionId && validated.sectionId !== '__none__') {
        await tx.cohortSection.create({
          data: {
            tenantId,
            cohortId: cohort.id,
            sectionId: validated.sectionId,
          },
        })
      }
    })

    revalidatePath('/academic-setup/cohorts')
    revalidatePath('/academic-setup/sections')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to create cohort' }
  }
}

export async function updateCohort(
  id: string,
  data: z.infer<typeof cohortSchema>
) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = cohortSchema.parse(data)

    // Update cohort only (section linking is managed separately via junction table)
    await prisma.cohort.update({
      where: { id, tenantId },
      data: {
        name: validated.name,
        yearId: validated.yearId,
        classId: validated.classId,
        streamId: validated.streamId || null,
        branchId: validated.branchId,
        status: validated.status,
        enrollmentOpen: validated.enrollmentOpen,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
      },
    })

    // Note: Section linking is now managed via CohortSection junction table
    // This should be handled separately through a dedicated "Manage Sections" UI

    revalidatePath('/academic-setup/cohorts')
    revalidatePath('/academic-setup/sections')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to update cohort' }
  }
}

export async function toggleEnrollmentOpen(id: string, enrollmentOpen: boolean) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    await prisma.cohort.update({
      where: { id, tenantId },
      data: { enrollmentOpen },
    })

    revalidatePath('/academic-setup/cohorts')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to toggle enrollment' }
  }
}

export async function deleteCohort(id: string) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Get sections linked to this cohort via junction table
    const cohortSections = await prisma.cohortSection.findMany({
      where: { cohortId: id, tenantId },
      include: {
        section: {
          select: {
            id: true,
            name: true,
            enrollments: {
              select: { id: true },
            },
            routines: {
              select: { id: true },
            },
          },
        },
      },
    })

    if (cohortSections.length > 0) {
      // Check if any linked section has student enrollments
      const sectionsWithEnrollments = cohortSections.filter(
        cs => cs.section.enrollments.length > 0
      )

      if (sectionsWithEnrollments.length > 0) {
        const totalEnrollments = sectionsWithEnrollments.reduce(
          (sum, cs) => sum + cs.section.enrollments.length,
          0
        )
        return {
          success: false,
          error: `Cannot delete: ${totalEnrollments} student${totalEnrollments > 1 ? 's' : ''} enrolled in linked sections`,
        }
      }

      // Check if any linked section has routines
      const sectionsWithRoutines = cohortSections.filter(
        cs => cs.section.routines.length > 0
      )

      if (sectionsWithRoutines.length > 0) {
        const totalRoutines = sectionsWithRoutines.reduce(
          (sum, cs) => sum + cs.section.routines.length,
          0
        )
        return {
          success: false,
          error: `Cannot delete: ${totalRoutines} routine${totalRoutines > 1 ? 's' : ''} exist in linked sections`,
        }
      }

      // If no enrollments or routines, just delete the junction table entries
      // Sections themselves remain intact (they're reusable resources)
      await prisma.cohortSection.deleteMany({
        where: {
          cohortId: id,
          tenantId,
        },
      })
    }

    // Now delete the cohort (junction table entries are already deleted)
    await prisma.cohort.delete({
      where: { id, tenantId },
    })

    revalidatePath('/academic-setup/cohorts')
    revalidatePath('/academic-setup/sections')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to delete cohort' }
  }
}

