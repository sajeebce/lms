'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'

const cohortSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  yearId: z.string().min(1, 'Academic year is required'),
  classId: z.string().min(1, 'Class is required'),
  branchId: z.string().min(1, 'Branch is required'),
  status: z.enum(['PLANNED', 'RUNNING', 'FINISHED', 'ARCHIVED']),
  enrollmentOpen: z.boolean(),
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
        branchId: validated.branchId,
        name: validated.name,
      },
    })

    if (existing) {
      return { success: false, error: 'Cohort with this combination already exists' }
    }

    await prisma.cohort.create({
      data: { ...validated, tenantId },
    })

    revalidatePath('/academic-setup/cohorts')
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

    await prisma.cohort.update({
      where: { id, tenantId },
      data: validated,
    })

    revalidatePath('/academic-setup/cohorts')
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

