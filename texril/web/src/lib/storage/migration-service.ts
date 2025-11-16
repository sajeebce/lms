import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { LocalStorageAdapter } from './adapters/local-storage'
import { R2StorageAdapter } from './adapters/r2-storage'
import type { StorageAdapter } from './storage-adapter'

export interface MigrationProgress {
  total: number
  completed: number
  failed: number
  current: string
  status: 'idle' | 'running' | 'completed' | 'failed'
  errors: string[]
}

export interface MigrationOptions {
  direction: 'local-to-r2' | 'r2-to-local'
  deleteSource?: boolean // Delete files from source after successful migration
  onProgress?: (progress: MigrationProgress) => void
}

/**
 * Storage Migration Service
 * Migrates files between Local Storage and Cloudflare R2
 */
export class StorageMigrationService {
  private sourceAdapter: StorageAdapter
  private targetAdapter: StorageAdapter
  private progress: MigrationProgress = {
    total: 0,
    completed: 0,
    failed: 0,
    current: '',
    status: 'idle',
    errors: [],
  }

  constructor(private options: MigrationOptions) {
    if (options.direction === 'local-to-r2') {
      this.sourceAdapter = new LocalStorageAdapter()
      this.targetAdapter = new R2StorageAdapter()
    } else {
      this.sourceAdapter = new R2StorageAdapter()
      this.targetAdapter = new LocalStorageAdapter()
    }
  }

  /**
   * Start migration process
   */
  async migrate(): Promise<MigrationProgress> {
    try {
      this.progress.status = 'running'
      this.notifyProgress()

      // Get all files from database
      const tenantId = await getTenantId()
      const files = await prisma.uploadedFile.findMany({
        where: { tenantId },
        orderBy: { uploadedAt: 'asc' },
      })

      this.progress.total = files.length
      this.notifyProgress()

      // Migrate each file
      for (const file of files) {
        try {
          this.progress.current = file.fileName
          this.notifyProgress()

          await this.migrateFile(file)

          this.progress.completed++
          this.notifyProgress()
        } catch (error) {
          this.progress.failed++
          this.progress.errors.push(`${file.fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          this.notifyProgress()
        }
      }

      this.progress.status = this.progress.failed > 0 ? 'failed' : 'completed'
      this.progress.current = ''
      this.notifyProgress()

      return this.progress
    } catch (error) {
      this.progress.status = 'failed'
      this.progress.errors.push(error instanceof Error ? error.message : 'Unknown error')
      this.notifyProgress()
      throw error
    }
  }

  /**
   * Migrate a single file
   */
  private async migrateFile(file: any): Promise<void> {
    // Download from source
    const sourceData = await this.sourceAdapter.download(file.key)

    // Convert to File object
    const blob = new Blob([sourceData], { type: file.mimeType })
    const fileObj = new File([blob], file.fileName, { type: file.mimeType })

    // Upload to target
    const result = await this.targetAdapter.upload({
      key: file.key,
      file: fileObj,
      contentType: file.mimeType,
      metadata: {
        originalUrl: file.url,
        migratedAt: new Date().toISOString(),
      },
      isPublic: file.isPublic,
    })

    // Update database with new URL
    await prisma.uploadedFile.update({
      where: { id: file.id },
      data: { url: result.url },
    })

    // Delete from source if requested
    if (this.options.deleteSource) {
      await this.sourceAdapter.delete(file.key)
    }
  }

  /**
   * Notify progress callback
   */
  private notifyProgress(): void {
    if (this.options.onProgress) {
      this.options.onProgress({ ...this.progress })
    }
  }

  /**
   * Get current progress
   */
  getProgress(): MigrationProgress {
    return { ...this.progress }
  }
}

/**
 * Estimate migration size and time
 */
export async function estimateMigration(direction: 'local-to-r2' | 'r2-to-local'): Promise<{
  totalFiles: number
  totalSize: number
  estimatedTime: string
}> {
  const tenantId = await getTenantId()
  
  const files = await prisma.uploadedFile.findMany({
    where: { tenantId },
    select: { fileSize: true },
  })

  const totalFiles = files.length
  const totalSize = files.reduce((sum, f) => sum + f.fileSize, 0)
  
  // Estimate: ~1MB per second (conservative)
  const estimatedSeconds = Math.ceil(totalSize / (1024 * 1024))
  const estimatedTime = formatDuration(estimatedSeconds)

  return {
    totalFiles,
    totalSize,
    estimatedTime,
  }
}

/**
 * Format duration in seconds to human-readable string
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} minutes`
  return `${Math.ceil(seconds / 3600)} hours`
}

/**
 * Check if R2 is configured
 */
export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  )
}

/**
 * Get current storage adapter type
 */
export async function getCurrentStorageType(): Promise<'local' | 'r2'> {
  // Check settings in database
  const tenantId = await getTenantId()
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  })

  // Default to local if not configured
  if (!settings || !isR2Configured()) {
    return 'local'
  }

  // Check if R2 is enabled in settings (you can add this field to TenantSettings)
  // For now, return 'local' as default
  return 'local'
}

