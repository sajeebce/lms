'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const academicSettingsSchema = z.object({
  enableCohorts: z.boolean(),
})

export async function updateAcademicSettings(data: z.infer<typeof academicSettingsSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = academicSettingsSchema.parse(data)

    // Upsert tenant settings
    await prisma.tenantSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        enableCohorts: validated.enableCohorts,
      },
      update: {
        enableCohorts: validated.enableCohorts,
      },
    })

    // Revalidate affected pages
    revalidatePath('/students/admission')
    revalidatePath('/courses')
    revalidatePath('/settings/academic')

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to update settings' }
  }
}

