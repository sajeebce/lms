import { NextRequest, NextResponse } from 'next/server'
import { getTenantId, getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const tenantId = await getTenantId()
    const currentUser = await getCurrentUser()
    const { lessonId } = await params

    // 1. Fetch lesson
    const lesson = await prisma.courseLesson.findFirst({
      where: {
        id: lessonId,
        tenantId,
      },
      include: {
        topic: {
          include: {
            course: true,
          },
        },
      },
    })

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // 2. Check access permissions (same as document route)
    const isAdmin = currentUser.role === 'ADMIN'
    const isPublic = lesson.accessType === 'PUBLIC'
    const isPreview = lesson.isPreview

    if (!isAdmin && !isPublic && !isPreview) {
      // TODO: Add enrollment check
    }

    // 3. Check password protection
    if (lesson.accessType === 'PASSWORD' && !isPreview) {
      const password = request.nextUrl.searchParams.get('password')
      if (password !== lesson.password) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 403 }
        )
      }
    }

    // 4. Serve the video
    if (!lesson.videoFilePath) {
      return NextResponse.json(
        { error: 'No video file attached to this lesson' },
        { status: 404 }
      )
    }

    // Construct full file path
    const fullPath = path.join(process.cwd(), 'storage', lesson.videoFilePath)

    // Check if file exists
    try {
      await fs.access(fullPath)
    } catch {
      return NextResponse.json(
        { error: 'Video file not found' },
        { status: 404 }
      )
    }

    // Get file stats for range requests (streaming support)
    const stats = await fs.stat(fullPath)
    const fileSize = stats.size

    // Handle range requests for video streaming
    const range = request.headers.get('range')
    
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunkSize = end - start + 1

      const fileStream = await fs.readFile(fullPath)
      const chunk = fileStream.slice(start, end + 1)

      return new NextResponse(chunk, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': 'video/mp4',
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    }

    // Serve full video if no range requested
    const fileBuffer = await fs.readFile(fullPath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': fileSize.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Error serving lesson video:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to serve video' },
      { status: 500 }
    )
  }
}

