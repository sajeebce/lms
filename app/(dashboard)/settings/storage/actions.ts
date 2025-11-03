'use server'

import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { resetStorageInstance } from '@/lib/storage/storage-factory'

const storageSettingsSchema = z.object({
  storageType: z.enum(['LOCAL', 'R2']),
  storageLocalPath: z.string().optional(),
  storageR2AccountId: z.string().optional(),
  storageR2AccessKeyId: z.string().optional(),
  storageR2SecretAccessKey: z.string().optional(),
  storageR2Bucket: z.string().optional(),
  storageR2PublicUrl: z.string().optional(),
})

export async function updateStorageSettings(data: z.infer<typeof storageSettingsSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    const validated = storageSettingsSchema.parse(data)

    // Validate R2 settings if R2 is selected
    if (validated.storageType === 'R2') {
      if (!validated.storageR2AccountId || !validated.storageR2AccessKeyId ||
          !validated.storageR2SecretAccessKey || !validated.storageR2Bucket) {
        return {
          success: false,
          error: 'All R2 fields are required when using R2 storage'
        }
      }
    }

    // Update settings
    await prisma.tenantSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        ...validated,
      },
      update: validated,
    })

    // Reset storage instance to pick up new settings
    resetStorageInstance()

    revalidatePath('/settings/storage')
    return { success: true }
  } catch (error: any) {
    console.error('Update storage settings error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: error.message || 'Failed to update storage settings' }
  }
}

export async function testStorageConnection(storageType: 'LOCAL' | 'R2', config: any) {
  try {
    await requireRole('ADMIN')

    let adapter
    if (storageType === 'R2') {
      const { R2StorageAdapter } = await import('@/lib/storage/adapters/r2-storage')
      adapter = new R2StorageAdapter({
        accountId: config.storageR2AccountId,
        accessKeyId: config.storageR2AccessKeyId,
        secretAccessKey: config.storageR2SecretAccessKey,
        bucket: config.storageR2Bucket,
        publicUrl: config.storageR2PublicUrl,
      })
    } else {
      const { LocalStorageAdapter } = await import('@/lib/storage/adapters/local-storage')
      adapter = new LocalStorageAdapter(config.storageLocalPath || './storage')
    }

    const result = await adapter.testConnection()
    return result
  } catch (error: any) {
    console.error('Test storage connection error:', error)
    return {
      success: false,
      error: error.message || 'Failed to test storage connection'
    }
  }
}

