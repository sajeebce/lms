// Local Storage Adapter - For development and local deployments

import fs from 'fs/promises'
import path from 'path'
import { StorageAdapter, UploadParams, UploadResult, StorageObject } from '../storage-adapter'

export class LocalStorageAdapter implements StorageAdapter {
  private basePath: string

  constructor(basePath: string = './storage') {
    this.basePath = basePath
  }

  async upload(params: UploadParams): Promise<UploadResult> {
    const fullPath = path.join(this.basePath, params.key)
    const dir = path.dirname(fullPath)

    // Create directory if not exists
    await fs.mkdir(dir, { recursive: true })

    // Write file
    const buffer = params.file instanceof Buffer
      ? params.file
      : Buffer.from(await (params.file as File).arrayBuffer())
    
    await fs.writeFile(fullPath, buffer)

    // Get file stats
    const stats = await fs.stat(fullPath)

    return {
      key: params.key,
      url: `/api/storage/${params.key}`, // Serve via API route
      size: stats.size,
    }
  }

  async download(key: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, key)
    return await fs.readFile(fullPath)
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.basePath, key)
    try {
      await fs.unlink(fullPath)
      
      // Clean up empty parent directories
      await this.cleanupEmptyDirs(path.dirname(fullPath))
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map(key => this.delete(key)))
  }

  async getUrl(key: string, expiresIn?: number): Promise<string> {
    // For local storage, return API route URL
    // expiresIn can be used to generate signed URLs if needed
    return `/api/storage/${key}`
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = path.join(this.basePath, key)
    try {
      await fs.access(fullPath)
      return true
    } catch {
      return false
    }
  }

  async list(prefix: string): Promise<StorageObject[]> {
    const fullPath = path.join(this.basePath, prefix)
    const files: StorageObject[] = []

    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true })
      
      for (const entry of entries) {
        const entryPath = path.join(fullPath, entry.name)
        const relativePath = path.relative(this.basePath, entryPath)
        
        if (entry.isFile()) {
          const stats = await fs.stat(entryPath)
          files.push({
            key: relativePath.replace(/\\/g, '/'), // Normalize path separators
            size: stats.size,
            lastModified: stats.mtime,
          })
        } else if (entry.isDirectory()) {
          // Recursively list subdirectories
          const subFiles = await this.list(relativePath)
          files.push(...subFiles)
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error
    }

    return files
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test by creating a test directory
      const testPath = path.join(this.basePath, 'test')
      await fs.mkdir(testPath, { recursive: true })
      
      // Test write
      const testFile = path.join(testPath, 'test.txt')
      await fs.writeFile(testFile, 'test')
      
      // Test read
      await fs.readFile(testFile)
      
      // Cleanup
      await fs.unlink(testFile)
      await fs.rmdir(testPath)
      
      return { success: true }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to access local storage' 
      }
    }
  }

  private async cleanupEmptyDirs(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir)
      if (entries.length === 0 && dir !== this.basePath) {
        await fs.rmdir(dir)
        // Recursively clean parent
        await this.cleanupEmptyDirs(path.dirname(dir))
      }
    } catch {
      // Ignore errors
    }
  }
}

