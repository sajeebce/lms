'use server'

import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const generalSettingsSchema = z.object({
  instituteName: z.string().max(200, 'Institute name must be 200 characters or less').optional().nullable(),
  logoUrl: z.string().max(500, 'Logo URL must be 500 characters or less').optional().nullable(),
  signatureUrl: z.string().max(500, 'Signature URL must be 500 characters or less').optional().nullable(),
  currencyName: z.string().max(20, 'Currency name must be 20 characters or less').optional().nullable(),
  currencySymbol: z.string().max(10, 'Currency symbol must be 10 characters or less').optional().nullable(),
  countryCode: z.string().max(10, 'Country code must be 10 characters or less').optional().nullable(),
  phonePrefix: z.string().max(10, 'Phone prefix must be 10 characters or less').optional().nullable(),
})

export async function updateGeneralSettings(data: z.infer<typeof generalSettingsSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    const validated = generalSettingsSchema.parse(data)

    // Update or create settings
    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: validated,
      create: {
        tenantId,
        ...validated,
      },
    })

    revalidatePath('/settings/general')
    return { success: true, data: settings }
  } catch (error) {
    console.error('Error updating general settings:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to update general settings' }
  }
}

export async function uploadFile(formData: FormData) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    const file = formData.get('file') as File
    const fieldName = formData.get('fieldName') as string

    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // For now, we'll just return a placeholder URL
    // In production, this would upload to local storage or R2
    const fileName = `${tenantId}_${fieldName}_${Date.now()}_${file.name}`
    const fileUrl = `/uploads/${fileName}`

    // TODO: Implement actual file upload logic based on storage provider
    // For now, return mock URL
    return { success: true, url: fileUrl }
  } catch (error) {
    console.error('Error uploading file:', error)
    return { success: false, error: 'Failed to upload file' }
  }
}

