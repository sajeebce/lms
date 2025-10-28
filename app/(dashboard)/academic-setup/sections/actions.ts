'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'

const sectionSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  cohortId: z.string().min(1, 'Cohort is required'),
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

    // Check for duplicate
    const existing = await prisma.section.findFirst({
      where: {
        tenantId,
        cohortId: validated.cohortId,
        name: validated.name,
      },
    })

    if (existing) {
      return {
        success: false,
        error: 'Section with this name already exists in this cohort',
      }
    }

    await prisma.section.create({
      data: {
        ...validated,
        tenantId,
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

    // TODO: Check for students assigned (placeholder for now)
    // const studentCount = await prisma.studentPlacement.count({
    //   where: { sectionId: id, tenantId },
    // })
    // if (studentCount > 0) {
    //   return {
    //     success: false,
    //     error: `Cannot delete: ${studentCount} student(s) assigned`,
    //   }
    // }

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

