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

    // 1. Fetch lesson with course enrollment check
    const lesson = await prisma.courseLesson.findFirst({
      where: {
        id: lessonId,
        tenantId,
      },
      include: {
        topic: {
          include: {
            course: {
              include: {
                enrollments: {
                  where: {
                    // In real app, check if current user's student is enrolled
                    // For now, we'll allow ADMIN to view all
                  },
                },
              },
            },
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

    // 2. Check access permissions
    const isAdmin = currentUser.role === 'ADMIN'
    const isPublic = lesson.accessType === 'PUBLIC'
    const isPreview = lesson.isPreview

    // For now, allow ADMIN and PUBLIC/PREVIEW lessons
    // In production, add enrollment check for ENROLLED_ONLY
    if (!isAdmin && !isPublic && !isPreview) {
      // TODO: Check if user is enrolled in the course
      // const enrollment = await prisma.courseEnrollment.findFirst({
      //   where: {
      //     courseId: lesson.topic.course.id,
      //     studentId: currentUser.studentId,
      //     tenantId,
      //   },
      // })
      // if (!enrollment) {
      //   return NextResponse.json(
      //     { error: 'You must be enrolled to view this lesson' },
      //     { status: 403 }
      //   )
      // }
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

    // 4. Serve the document
    if (!lesson.documentPath) {
      return NextResponse.json(
        { error: 'No document attached to this lesson' },
        { status: 404 }
      )
    }

    // Construct full file path
    const fullPath = path.join(process.cwd(), 'storage', lesson.documentPath)

    // Check if file exists
    try {
      await fs.access(fullPath)
    } catch {
      return NextResponse.json(
        { error: 'Document file not found' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await fs.readFile(fullPath)

    // Determine content type
    const ext = path.extname(lesson.documentPath).toLowerCase()
    const contentTypeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    }
    const contentType = contentTypeMap[ext] || 'application/octet-stream'

    // Determine Content-Disposition based on allowDownload
    const fileName = lesson.documentPath.split('/').pop() || 'document'
    const disposition = lesson.allowDownload
      ? `attachment; filename="${fileName}"`
      : 'inline'

    // Return file with security headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    })
  } catch (error) {
    console.error('Error serving lesson document:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to serve document' },
      { status: 500 }
    )
  }
}

