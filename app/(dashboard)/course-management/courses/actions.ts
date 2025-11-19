'use server'

import { requireRole, getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function deleteCourse(id: string) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Check if course has enrollments
    const course = await prisma.course.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    })

    if (!course) {
      return { success: false, error: 'Course not found' }
    }

    if (course._count.enrollments > 0) {
      return {
        success: false,
        error: `Cannot delete course with ${course._count.enrollments} active enrollments`,
      }
    }

    // Delete course (cascade will delete topics, lessons, FAQs)
    await prisma.course.delete({
      where: { id },
    })

    revalidatePath('/course-management/courses')
    return { success: true }
  } catch (error) {
    console.error('Delete course error:', error)
    return { success: false, error: 'Failed to delete course' }
  }
}


export async function publishCourse(id: string) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    const course = await prisma.course.findFirst({
      where: { id, tenantId },
    })

    if (!course) {
      return { success: false, error: 'Course not found' }
    }

    if (course.status === 'PUBLISHED') {
      return { success: true, alreadyPublished: true }
    }

    await prisma.course.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: course.publishedAt ?? new Date(),
        scheduledAt: null,
      },
    })

    revalidatePath('/course-management/courses')
    revalidatePath(`/course-management/courses/${id}`)

    return { success: true, alreadyPublished: false }
  } catch (error) {
    console.error('Publish course error:', error)
    return { success: false, error: 'Failed to publish course' }
  }
}



export async function duplicateCourse(id: string) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Fetch original course with topics, lessons and FAQs
    const original = await prisma.course.findFirst({
      where: { id, tenantId },
      include: {
        topics: {
          include: {
            lessons: true,
          },
          orderBy: { order: 'asc' },
        },
        faqs: { orderBy: { order: 'asc' } },
      },
    })

    if (!original) {
      return { success: false, error: 'Course not found' }
    }

    // Ensure slug stays within 200 characters (matches form validation)
    const suffix = `-copy-${Date.now().toString(36)}`
    const maxSlugLength = 200
    let baseSlug = original.slug
    if (baseSlug.length + suffix.length > maxSlugLength) {
      baseSlug = baseSlug.slice(0, maxSlugLength - suffix.length)
    }
    const newSlug = `${baseSlug}${suffix}`

    // Deep clone course + topics + lessons + FAQs (+ bundle children if bundle)
    const duplicated = await prisma.$transaction(async (tx) => {
      const newCourse = await tx.course.create({
        data: {
          tenantId,
          title: `${original.title} (Copy)`,
          slug: newSlug,
          description: original.description,
          shortDescription: original.shortDescription,
          categoryId: original.categoryId,
          courseType: original.courseType,
          classId: original.classId,
          subjectId: original.subjectId,
          streamId: original.streamId,
          authorName: original.authorName,
          instructorId: original.instructorId,
          paymentType: original.paymentType,
          invoiceTitle: original.invoiceTitle,
          regularPrice: original.regularPrice,
          offerPrice: original.offerPrice,
          currency: original.currency,
          subscriptionDuration: original.subscriptionDuration,
          subscriptionType: original.subscriptionType,
          autoGenerateInvoice: original.autoGenerateInvoice,
          featuredImage: original.featuredImage,
          introVideoUrl: original.introVideoUrl,
          introVideoAutoplay: original.introVideoAutoplay,
          status: 'DRAFT',
          publishedAt: null,
          scheduledAt: null,
          metaTitle: original.metaTitle,
          metaDescription: original.metaDescription,
          metaKeywords: original.metaKeywords,
          fakeEnrollmentCount: original.fakeEnrollmentCount,
          isFeatured: false,
          allowComments: original.allowComments,
          certificateEnabled: original.certificateEnabled,
          totalTopics: original.totalTopics,
          totalLessons: original.totalLessons,
          totalDuration: original.totalDuration,
          totalEnrollments: 0,
        },
      })

      for (const topic of original.topics) {
        const newTopic = await tx.courseTopic.create({
          data: {
            tenantId,
            courseId: newCourse.id,
            title: topic.title,
            description: topic.description,
            order: topic.order,
          },
        })

        for (const lesson of topic.lessons) {
          await tx.courseLesson.create({
            data: {
              tenantId,
              topicId: newTopic.id,
              title: lesson.title,
              description: lesson.description,
              lessonType: lesson.lessonType,
              order: lesson.order,
              videoUrl: lesson.videoUrl,
              videoFilePath: lesson.videoFilePath,
              documentPath: lesson.documentPath,
              textContent: lesson.textContent,
              iframeUrl: lesson.iframeUrl,
              duration: lesson.duration,
              isPreview: lesson.isPreview,
              accessType: lesson.accessType,
              password: lesson.password,
            },
          })
        }
      }

      for (const faq of original.faqs) {
        await tx.courseFAQ.create({
          data: {
            tenantId,
            courseId: newCourse.id,
            question: faq.question,
            answer: faq.answer,
            order: faq.order,
          },
        })
      }

      // If this is a bundle course, duplicate its child relations
      if (original.courseType === 'BUNDLE') {
        const bundleItems = await tx.bundleCourse.findMany({
          where: {
            tenantId,
            bundleId: original.id,
          },
          orderBy: { order: 'asc' },
        })

        for (const item of bundleItems) {
          await tx.bundleCourse.create({
            data: {
              tenantId,
              bundleId: newCourse.id,
              courseId: item.courseId,
              order: item.order,
            },
          })
        }
      }

      return newCourse
    })

    revalidatePath('/course-management/courses')

    return {
      success: true,
      courseId: duplicated.id,
    }
  } catch (error) {
    console.error('Duplicate course error:', error)
    return { success: false, error: 'Failed to duplicate course' }
  }
}
