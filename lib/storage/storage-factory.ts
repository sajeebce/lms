// Storage Factory - Creates storage adapter based on configuration

import { StorageAdapter, StorageConfig } from './storage-adapter'
import { LocalStorageAdapter } from './adapters/local-storage'
import { R2StorageAdapter } from './adapters/r2-storage'
import { prisma } from '@/lib/prisma'

export async function getStorageConfig(): Promise<StorageConfig> {
  // Try to get config from database (tenant settings)
  try {
    const settings = await prisma.tenantSettings.findFirst({
      select: {
        storageType: true,
        storageLocalPath: true,
        storageR2AccountId: true,
        storageR2AccessKeyId: true,
        storageR2SecretAccessKey: true,
        storageR2Bucket: true,
        storageR2PublicUrl: true,
      },
    })

    if (settings?.storageType === 'R2' && settings.storageR2AccountId) {
      return {
        type: 'r2',
        r2: {
          accountId: settings.storageR2AccountId,
          accessKeyId: settings.storageR2AccessKeyId || '',
          secretAccessKey: settings.storageR2SecretAccessKey || '',
          bucket: settings.storageR2Bucket || '',
          publicUrl: settings.storageR2PublicUrl || undefined,
        },
      }
    }

    // Default to local storage
    return {
      type: 'local',
      local: {
        path: settings?.storageLocalPath || './storage',
      },
    }
  } catch (error) {
    // Fallback to environment variables if database not available
    const storageType = process.env.STORAGE_TYPE || 'local'

    if (storageType === 'r2') {
      return {
        type: 'r2',
        r2: {
          accountId: process.env.R2_ACCOUNT_ID || '',
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
          bucket: process.env.R2_BUCKET || '',
          publicUrl: process.env.R2_PUBLIC_URL,
        },
      }
    }

    return {
      type: 'local',
      local: {
        path: process.env.STORAGE_PATH || './storage',
      },
    }
  }
}

export async function createStorageAdapter(config?: StorageConfig): Promise<StorageAdapter> {
  const storageConfig = config || await getStorageConfig()

  if (storageConfig.type === 'r2' && storageConfig.r2) {
    return new R2StorageAdapter(storageConfig.r2)
  }

  // Default to local storage
  return new LocalStorageAdapter(storageConfig.local?.path || './storage')
}

// Singleton instance
let storageInstance: StorageAdapter | null = null

export async function getStorage(): Promise<StorageAdapter> {
  if (!storageInstance) {
    storageInstance = await createStorageAdapter()
  }
  return storageInstance
}

// Reset storage instance (useful when settings change)
export function resetStorageInstance() {
  storageInstance = null
}

