import { NextRequest, NextResponse } from 'next/server'
import { getStorageService } from '@/lib/storage/storage-service'
import { getTenantId } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const tenantId = await getTenantId()
    const { fileId } = await params

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    const storageService = getStorageService()
    await storageService.deleteUploadedFile(fileId)

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    })
  } catch (error) {
    console.error('Delete file error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete file' },
      { status: 500 }
    )
  }
}

