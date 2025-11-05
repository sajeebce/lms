import { NextRequest, NextResponse } from 'next/server'
import { requireRole, getTenantId } from '@/lib/auth'
import { getStorageService } from '@/lib/storage/storage-service'

export async function POST(request: NextRequest) {
  try {
    // 1. ROLE GUARD
    await requireRole(['ADMIN', 'TEACHER'])

    // 2. TENANT ID
    const tenantId = await getTenantId()

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const questionId = formData.get('questionId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Upload to storage
    const storageService = getStorageService()
    const url = await storageService.uploadQuestionImage(questionId || 'temp', file)

    return NextResponse.json({ success: true, url })
  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}

