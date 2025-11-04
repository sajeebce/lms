'use server'

import { requireRole, getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const courseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().min(1, 'Slug is required').max(200),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  paymentType: z.enum(['FREE', 'ONE_TIME', 'SUBSCRIPTION']),
  invoiceTitle: z.string().max(200).optional(),
  regularPrice: z.number().min(0).optional(),
  offerPrice: z.number().min(0).optional(),
  currency: z.string().default('BDT'),
  subscriptionDuration: z.number().min(1).optional(),
  subscriptionType: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']).optional(),
  autoGenerateInvoice: z.boolean().default(true),
  featuredImage: z.string().optional(),
  introVideoUrl: z.string().optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  metaKeywords: z.string().max(500).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'PRIVATE']),
  publishedAt: z.date().optional(),
  scheduledAt: z.date().optional(),
  isFeatured: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  certificateEnabled: z.boolean().default(false),
  faqs: z.array(
    z.object({
      question: z.string().min(1).max(500),
      answer: z.string().min(1),
    })
  ).optional(),
})

export async function updateCourse(id: string, data: z.infer<typeof courseSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Validate
    const validated = courseSchema.parse(data)

    // Check if course exists
    const existing = await prisma.course.findFirst({
      where: { id, tenantId },
    })

    if (!existing) {
      return { success: false, error: 'Course not found' }
    }

    // Check slug uniqueness (exclude current course)
    const slugExists = await prisma.course.findFirst({
      where: {
        tenantId,
        slug: validated.slug,
        NOT: { id },
      },
    })

    if (slugExists) {
      return { success: false, error: 'A course with this slug already exists' }
    }

    // Delete existing FAQs and create new ones
    await prisma.courseFAQ.deleteMany({
      where: { courseId: id },
    })

    // Update course
    const course = await prisma.course.update({
      where: { id },
      data: {
        ...validated,
        categoryId: validated.categoryId || null,
        publishedAt: validated.status === 'PUBLISHED' && !existing.publishedAt ? new Date() : validated.publishedAt,
        faqs: validated.faqs && validated.faqs.length > 0 ? {
          create: validated.faqs.map((faq, index) => ({
            tenantId,
            question: faq.question,
            answer: faq.answer,
            order: index + 1,
          })),
        } : undefined,
      },
    })

    revalidatePath('/course-management/courses')
    revalidatePath(`/course-management/courses/${id}`)
    return { success: true, data: course }
  } catch (error) {
    console.error('Update course error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to update course' }
  }
}

