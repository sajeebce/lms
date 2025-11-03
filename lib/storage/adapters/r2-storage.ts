// Cloudflare R2 Storage Adapter - For production deployments

import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand, 
  DeleteObjectsCommand, 
  HeadObjectCommand, 
  ListObjectsV2Command 
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { StorageAdapter, UploadParams, UploadResult, StorageObject } from '../storage-adapter'

export class R2StorageAdapter implements StorageAdapter {
  private client: S3Client
  private bucket: string
  private publicUrl?: string // Optional: R2 public bucket URL or custom domain

  constructor(config: {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucket: string
    publicUrl?: string
  }) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
    this.bucket = config.bucket
    this.publicUrl = config.publicUrl
  }

  async upload(params: UploadParams): Promise<UploadResult> {
    const buffer = params.file instanceof Buffer
      ? params.file
      : Buffer.from(await (params.file as File).arrayBuffer())

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: params.key,
      Body: buffer,
      ContentType: params.contentType,
      Metadata: params.metadata,
    })

    const result = await this.client.send(command)

    // Generate URL
    const url = params.isPublic && this.publicUrl
      ? `${this.publicUrl}/${params.key}`
      : await this.getUrl(params.key)

    return {
      key: params.key,
      url,
      size: buffer.length,
      etag: result.ETag,
    }
  }

  async download(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    const result = await this.client.send(command)
    const stream = result.Body as any
    
    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    await this.client.send(command)
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return

    // R2 supports batch delete (max 1000 objects per request)
    const batches = []
    for (let i = 0; i < keys.length; i += 1000) {
      batches.push(keys.slice(i, i + 1000))
    }

    for (const batch of batches) {
      const command = new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: batch.map(key => ({ Key: key })),
          Quiet: true,
        },
      })

      await this.client.send(command)
    }
  }

  async getUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // If public URL is configured and file is public, return direct URL
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`
    }

    // Otherwise, generate presigned URL
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    return await getSignedUrl(this.client, command, { expiresIn })
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
      await this.client.send(command)
      return true
    } catch {
      return false
    }
  }

  async list(prefix: string): Promise<StorageObject[]> {
    const objects: StorageObject[] = []
    let continuationToken: string | undefined

    do {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })

      const result = await this.client.send(command)

      if (result.Contents) {
        objects.push(
          ...result.Contents.map(obj => ({
            key: obj.Key!,
            size: obj.Size!,
            lastModified: obj.LastModified!,
            etag: obj.ETag,
          }))
        )
      }

      continuationToken = result.NextContinuationToken
    } while (continuationToken)

    return objects
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test by listing objects (lightweight operation)
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        MaxKeys: 1,
      })

      await this.client.send(command)
      
      return { success: true }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to connect to R2' 
      }
    }
  }
}

