'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'

const sectionSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  capacity: z.number().int()
    .min(0, 'Capacity must be 0 or greater')
    .max(9999999, 'Capacity must be 9999999 or less'),
  note: z.string()
    .max(500, 'Note must be 500 characters or less')
    .optional(),
})

export async function createSection(data: z.infer<typeof sectionSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = sectionSchema.parse(data)

    // Check for duplicate (tenant-wide unique name)
    const existing = await prisma.section.findFirst({
      where: {
        tenantId,
        name: validated.name,
      },
    })

    if (existing) {
      return {
        success: false,
        error: 'Section with this name already exists',
      }
    }

    const createdSection = await prisma.section.create({
      data: {
        ...validated,
        tenantId,
        note: validated.note || null,
      },
    })

    revalidatePath('/academic-setup/sections')
    revalidatePath('/academic-setup/cohorts')
    revalidatePath('/academic-setup/year-wizard')
    return { success: true, section: { id: createdSection.id, name: createdSection.name } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to create section' }
  }
}

export async function updateSection(id: string, data: z.infer<typeof sectionSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = sectionSchema.parse(data)

    await prisma.section.update({
      where: { id, tenantId },
      data: {
        ...validated,
        note: validated.note || null,
      },
    })

    revalidatePath('/academic-setup/sections')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to update section' }
  }
}

export async function deleteSection(id: string) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Check for student enrollments
    const enrollmentCount = await prisma.studentEnrollment.count({
      where: { sectionId: id, tenantId },
    })

    if (enrollmentCount > 0) {
      return {
        success: false,
        error: `Cannot delete: ${enrollmentCount} student${enrollmentCount > 1 ? 's' : ''} enrolled`,
      }
    }

    // Check for routines
    const routineCount = await prisma.routine.count({
      where: { sectionId: id, tenantId },
    })

    if (routineCount > 0) {
      return {
        success: false,
        error: `Cannot delete: ${routineCount} routine${routineCount > 1 ? 's' : ''} linked`,
      }
    }

    await prisma.section.delete({
      where: { id, tenantId },
    })

    revalidatePath('/academic-setup/sections')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to delete section' }
  }
}

