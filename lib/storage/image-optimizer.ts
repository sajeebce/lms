import sharp from 'sharp'

export interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp' | 'original'
  maxSizeBytes?: number // If image > this size, optimize it
}

export interface OptimizationResult {
  buffer: Buffer
  format: string
  width: number
  height: number
  originalSize: number
  optimizedSize: number
  wasOptimized: boolean
  compressionRatio: number
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 85,
  format: 'original',
  maxSizeBytes: 2 * 1024 * 1024, // 2MB
}

/**
 * Optimize image file
 * - Auto-resize if larger than maxWidth/maxHeight
 * - Compress based on quality setting
 * - Convert format if specified
 * - Only optimize if file size > maxSizeBytes
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const originalSize = buffer.length

  // Check if optimization is needed
  if (originalSize <= (opts.maxSizeBytes || 0)) {
    // File is small enough, no optimization needed
    const metadata = await sharp(buffer).metadata()
    return {
      buffer,
      format: metadata.format || 'unknown',
      width: metadata.width || 0,
      height: metadata.height || 0,
      originalSize,
      optimizedSize: originalSize,
      wasOptimized: false,
      compressionRatio: 1,
    }
  }

  // Start optimization
  let image = sharp(buffer)
  const metadata = await image.metadata()

  // Resize if needed
  const needsResize =
    (metadata.width && opts.maxWidth && metadata.width > opts.maxWidth) ||
    (metadata.height && opts.maxHeight && metadata.height > opts.maxHeight)

  if (needsResize) {
    image = image.resize(opts.maxWidth, opts.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  // Determine output format
  let outputFormat = opts.format === 'original' ? metadata.format : opts.format
  if (!outputFormat || outputFormat === 'unknown') {
    outputFormat = 'jpeg' // Default fallback
  }

  // Apply format-specific compression
  switch (outputFormat) {
    case 'jpeg':
      image = image.jpeg({ quality: opts.quality, mozjpeg: true })
      break
    case 'png':
      image = image.png({ quality: opts.quality, compressionLevel: 9 })
      break
    case 'webp':
      image = image.webp({ quality: opts.quality })
      break
    default:
      // Keep original format
      break
  }

  // Get optimized buffer
  const optimizedBuffer = await image.toBuffer()
  const optimizedMetadata = await sharp(optimizedBuffer).metadata()

  return {
    buffer: optimizedBuffer,
    format: outputFormat,
    width: optimizedMetadata.width || 0,
    height: optimizedMetadata.height || 0,
    originalSize,
    optimizedSize: optimizedBuffer.length,
    wasOptimized: true,
    compressionRatio: originalSize / optimizedBuffer.length,
  }
}

/**
 * Check if file is an image
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

/**
 * Get recommended optimization settings based on image type
 */
export function getRecommendedSettings(mimeType: string): ImageOptimizationOptions {
  if (mimeType === 'image/png') {
    return {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 90, // PNG needs higher quality
      format: 'png',
      maxSizeBytes: 2 * 1024 * 1024,
    }
  }

  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
      format: 'jpeg',
      maxSizeBytes: 2 * 1024 * 1024,
    }
  }

  if (mimeType === 'image/webp') {
    return {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
      format: 'webp',
      maxSizeBytes: 2 * 1024 * 1024,
    }
  }

  // Default for other image types
  return {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    format: 'original',
    maxSizeBytes: 2 * 1024 * 1024,
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

