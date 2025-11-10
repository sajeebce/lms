import { NextRequest, NextResponse } from 'next/server'
import { getStorageService } from '@/lib/storage/storage-service'
import { getTenantId } from '@/lib/auth'
import { optimizeImage, isImage, getRecommendedSettings, formatBytes } from '@/lib/storage/image-optimizer'

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId()
    const formData = await request.formData()

    const file = formData.get('file') as File
    const category = formData.get('category') as string
    const entityType = formData.get('entityType') as string
    const entityId = formData.get('entityId') as string
    const isPublic = formData.get('isPublic') === 'true'

    // Optional metadata
    const author = formData.get('author') as string | null
    const description = formData.get('description') as string | null
    const altText = formData.get('altText') as string | null
    const width = formData.get('width') ? parseInt(formData.get('width') as string) : undefined
    const height = formData.get('height') ? parseInt(formData.get('height') as string) : undefined

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!category || !entityType || !entityId) {
      return NextResponse.json(
        { error: 'Missing required fields: category, entityType, entityId' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Optimize image if needed
    let fileToUpload = file
    let optimizationInfo = null

    if (isImage(file.type)) {
      const settings = getRecommendedSettings(file.type)
      const result = await optimizeImage(file, settings)

      if (result.wasOptimized) {
        // Create new File from optimized buffer
        const blob = new Blob([result.buffer], { type: `image/${result.format}` })
        const extension = result.format === 'jpeg' ? 'jpg' : result.format
        const newFileName = file.name.replace(/\.[^.]+$/, `.${extension}`)
        fileToUpload = new File([blob], newFileName, { type: `image/${result.format}` })

        optimizationInfo = {
          originalSize: result.originalSize,
          optimizedSize: result.optimizedSize,
          compressionRatio: result.compressionRatio,
          savedBytes: result.originalSize - result.optimizedSize,
          savedPercentage: Math.round((1 - result.compressionRatio) * 100),
        }
      }
    }

    const storageService = getStorageService()

    // Metadata options
    const metadata = {
      author: author || undefined,
      description: description || undefined,
      altText: altText || undefined,
      width,
      height,
    }

    // Route to appropriate upload method based on category
    let url: string
    let id: string = ''

    switch (category) {
      case 'student_photo':
        url = await storageService.uploadStudentPhoto(entityId, fileToUpload)
        break

      case 'question_image': {
        const result = await storageService.uploadQuestionImage(entityId, fileToUpload, metadata)
        url = result.url
        id = result.id
        break
      }

      // Add more cases as needed
      default:
        return NextResponse.json(
          { error: `Unsupported category: ${category}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      id,
      url,
      fileName: fileToUpload.name,
      fileSize: fileToUpload.size,
      mimeType: fileToUpload.type,
      optimization: optimizationInfo,
      // Return metadata for image properties dialog
      altText,
      width,
      height,
    })
  } catch (error) {
    console.error('File upload error:', error)

    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

