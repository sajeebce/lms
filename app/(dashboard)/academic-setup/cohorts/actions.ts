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
  status: z.enum(['PLANNED', 'RUNNING', 'FINISHED', 'ARCHIVED']),
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

      // If section selected, link it to this cohort
      if (validated.sectionId && validated.sectionId !== '__none__') {
        await tx.section.update({
          where: { id: validated.sectionId, tenantId },
          data: { cohortId: cohort.id },
        })
      }
    })

    revalidatePath('/academic-setup/cohorts')
    revalidatePath('/academic-setup/sections')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
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

    // Use transaction to update cohort and handle section linking
    await prisma.$transaction(async (tx) => {
      await tx.cohort.update({
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

      // Handle section linking (optional)
      if (validated.sectionId && validated.sectionId !== '__none__') {
        await tx.section.update({
          where: { id: validated.sectionId, tenantId },
          data: { cohortId: id },
        })
      }
    })

    revalidatePath('/academic-setup/cohorts')
    revalidatePath('/academic-setup/sections')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
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

    // Check for sections
    const sectionCount = await prisma.section.count({
      where: { cohortId: id, tenantId },
    })

    if (sectionCount > 0) {
      return {
        success: false,
        error: `Cannot delete: ${sectionCount} section${sectionCount > 1 ? 's' : ''} linked`,
      }
    }

    await prisma.cohort.delete({
      where: { id, tenantId },
    })

    revalidatePath('/academic-setup/cohorts')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to delete cohort' }
  }
}

