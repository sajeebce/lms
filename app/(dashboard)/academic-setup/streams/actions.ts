'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'

const streamSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  note: z.string().optional(),
})

export async function createStream(data: z.infer<typeof streamSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = streamSchema.parse(data)

    await prisma.stream.create({
      data: {
        ...validated,
        tenantId,
      },
    })

    revalidatePath('/academic-setup/streams')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to create stream' }
  }
}

export async function updateStream(id: string, data: z.infer<typeof streamSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = streamSchema.parse(data)

    await prisma.stream.update({
      where: { id, tenantId },
      data: validated,
    })

    revalidatePath('/academic-setup/streams')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to update stream' }
  }
}

export async function deleteStream(id: string) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Check if stream has classes
    const classCount = await prisma.class.count({
      where: { streamId: id, tenantId },
    })

    if (classCount > 0) {
      return {
        success: false,
        error: 'Used in Classes',
      }
    }

    await prisma.stream.delete({
      where: { id, tenantId },
    })

    revalidatePath('/academic-setup/streams')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to delete stream' }
  }
}

