// Storage Adapter Interface - Abstraction for Local and R2 storage

export interface StorageAdapter {
  upload(params: UploadParams): Promise<UploadResult>
  download(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
  deleteMany(keys: string[]): Promise<void>
  getUrl(key: string, expiresIn?: number): Promise<string>
  exists(key: string): Promise<boolean>
  list(prefix: string): Promise<StorageObject[]>
  testConnection(): Promise<{ success: boolean; error?: string }>
}

export interface UploadParams {
  key: string // Full path: tenants/{tenantId}/students/photos/{studentId}/profile.jpg
  file: Buffer | File
  contentType: string
  metadata?: Record<string, string>
  isPublic?: boolean
}

export interface UploadResult {
  key: string
  url: string
  size: number
  etag?: string
}

export interface StorageObject {
  key: string
  size: number
  lastModified: Date
  etag?: string
}

export type StorageType = 'local' | 'r2'

export interface StorageConfig {
  type: StorageType
  local?: {
    path: string
  }
  r2?: {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucket: string
    publicUrl?: string
  }
}

