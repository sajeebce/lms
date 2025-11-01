'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'

const academicYearSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  code: z.string()
    .min(1, 'Code is required')
    .max(20, 'Code must be 20 characters or less'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  state: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).default('PLANNED'),
})

export async function createAcademicYear(data: z.infer<typeof academicYearSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = academicYearSchema.parse(data)

    await prisma.academicYear.create({
      data: {
        ...validated,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        tenantId,
      },
    })

    revalidatePath('/academic-setup/academic-years')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to create academic year' }
  }
}

export async function updateAcademicYear(
  id: string,
  data: z.infer<typeof academicYearSchema>
) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = academicYearSchema.parse(data)

    await prisma.academicYear.update({
      where: { id, tenantId },
      data: {
        ...validated,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
      },
    })

    revalidatePath('/academic-setup/academic-years')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to update academic year' }
  }
}

export async function deleteAcademicYear(id: string) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Check if academic year has cohorts
    const cohortCount = await prisma.cohort.count({
      where: { yearId: id, tenantId },
    })

    if (cohortCount > 0) {
      return {
        success: false,
        error: 'Cannot delete: linked Cohorts exist',
      }
    }

    await prisma.academicYear.delete({
      where: { id, tenantId },
    })

    revalidatePath('/academic-setup/academic-years')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to delete academic year' }
  }
}

export async function archiveAcademicYear(id: string) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    await prisma.academicYear.update({
      where: { id, tenantId },
      data: { state: 'ARCHIVED' },
    })

    revalidatePath('/academic-setup/academic-years')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to archive academic year' }
  }
}

export async function setAsCurrent(id: string) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    await prisma.academicYear.update({
      where: { id, tenantId },
      data: { isCurrent: true },
    })

    revalidatePath('/academic-setup/academic-years')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to set as current' }
  }
}

export async function removeFromCurrent(id: string) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    await prisma.academicYear.update({
      where: { id, tenantId },
      data: { isCurrent: false },
    })

    revalidatePath('/academic-setup/academic-years')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to remove from current' }
  }
}
