'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'

const classSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  alias: z.string()
    .max(50, 'Alias must be 50 characters or less')
    .optional(),
  streamId: z.string().optional(),
  order: z.number().int().min(1, 'Order must be at least 1').max(9999, 'Order must be 9999 or less'),
})

export async function createClass(data: z.infer<typeof classSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = classSchema.parse(data)

    // Check if order already exists
    const existing = await prisma.class.findFirst({
      where: {
        tenantId,
        order: validated.order,
      },
    })

    if (existing) {
      return { success: false, error: 'Order number already exists' }
    }

    await prisma.class.create({
      data: {
        ...validated,
        tenantId,
        streamId: validated.streamId || null,
        alias: validated.alias || null,
      },
    })

    revalidatePath('/academic-setup/classes')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to create class' }
  }
}

export async function updateClass(
  id: string,
  data: z.infer<typeof classSchema>
) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = classSchema.parse(data)

    // Check if order already exists (excluding current class)
    const existing = await prisma.class.findFirst({
      where: {
        tenantId,
        order: validated.order,
        id: { not: id },
      },
    })

    if (existing) {
      return { success: false, error: 'Order number already exists' }
    }

    await prisma.class.update({
      where: { id, tenantId },
      data: {
        ...validated,
        streamId: validated.streamId || null,
        alias: validated.alias || null,
      },
    })

    revalidatePath('/academic-setup/classes')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to update class' }
  }
}

export async function deleteClass(id: string) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Check for cohorts (only dependency for Class model)
    const cohortCount = await prisma.cohort.count({
      where: { classId: id, tenantId },
    })

    if (cohortCount > 0) {
      return {
        success: false,
        error: `In Use: ${cohortCount} cohort${cohortCount > 1 ? 's' : ''} linked`,
      }
    }

    await prisma.class.delete({
      where: { id, tenantId },
    })

    revalidatePath('/academic-setup/classes')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to delete class' }
  }
}

