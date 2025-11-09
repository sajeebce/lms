import { NextRequest, NextResponse } from 'next/server'
import { getStorageService } from '@/lib/storage/storage-service'
import { getTenantId } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId()
    const { searchParams } = new URL(request.url)
    
    const category = searchParams.get('category') || undefined
    const entityType = searchParams.get('entityType') || undefined
    const entityId = searchParams.get('entityId') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const storageService = getStorageService()
    const allFiles = await storageService.listUploadedFiles(category, entityType, entityId)

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedFiles = allFiles.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      files: paginatedFiles,
      pagination: {
        page,
        limit,
        total: allFiles.length,
        totalPages: Math.ceil(allFiles.length / limit),
      },
    })
  } catch (error) {
    console.error('List files error:', error)
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    )
  }
}

