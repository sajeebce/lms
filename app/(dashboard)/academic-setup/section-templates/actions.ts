'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'

const templateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  classId: z.string().min(1, 'Class is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  note: z.string().optional(),
})

export async function createSectionTemplate(
  data: z.infer<typeof templateSchema>
) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = templateSchema.parse(data)

    // Check for duplicate
    const existing = await prisma.sectionTemplate.findFirst({
      where: {
        tenantId,
        classId: validated.classId,
        name: validated.name,
      },
    })

    if (existing) {
      return {
        success: false,
        error: 'Template with this name already exists for this class',
      }
    }

    await prisma.sectionTemplate.create({
      data: {
        ...validated,
        tenantId,
        note: validated.note || null,
      },
    })

    revalidatePath('/academic-setup/section-templates')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to create section template' }
  }
}

export async function updateSectionTemplate(
  id: string,
  data: z.infer<typeof templateSchema>
) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = templateSchema.parse(data)

    await prisma.sectionTemplate.update({
      where: { id, tenantId },
      data: {
        ...validated,
        note: validated.note || null,
      },
    })

    revalidatePath('/academic-setup/section-templates')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to update section template' }
  }
}

export async function deleteSectionTemplate(id: string) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    await prisma.sectionTemplate.delete({
      where: { id, tenantId },
    })

    revalidatePath('/academic-setup/section-templates')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to delete section template' }
  }
}

