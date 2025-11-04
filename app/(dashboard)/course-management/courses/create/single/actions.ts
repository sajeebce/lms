'use server'

import { requireRole, getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const courseSchema = z.object({
  // Basic Info
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().min(1, 'Slug is required').max(200),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  
  // Pricing
  paymentType: z.enum(['FREE', 'ONE_TIME', 'SUBSCRIPTION']),
  invoiceTitle: z.string().max(200).optional(),
  regularPrice: z.number().optional(),
  offerPrice: z.number().optional(),
  currency: z.string().default('BDT'),
  subscriptionDuration: z.number().optional(),
  subscriptionType: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']).optional(),
  autoGenerateInvoice: z.boolean().default(true),
  
  // Media
  featuredImage: z.string().optional(),
  introVideoUrl: z.string().optional(),
  
  // SEO
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  metaKeywords: z.string().max(500).optional(),
  
  // Settings
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'PRIVATE']),
  publishedAt: z.date().optional(),
  scheduledAt: z.date().optional(),
  isFeatured: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  certificateEnabled: z.boolean().default(false),
  
  // FAQ
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
})

export async function createSingleCourse(data: z.infer<typeof courseSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Validate
    const validated = courseSchema.parse(data)

    // Check slug uniqueness
    const existing = await prisma.course.findFirst({
      where: {
        tenantId,
        slug: validated.slug,
      },
    })

    if (existing) {
      return { success: false, error: 'A course with this slug already exists' }
    }

    // Create course with FAQs
    const course = await prisma.course.create({
      data: {
        tenantId,
        courseType: 'SINGLE',
        title: validated.title,
        slug: validated.slug,
        categoryId: validated.categoryId,
        description: validated.description,
        shortDescription: validated.shortDescription,
        paymentType: validated.paymentType,
        invoiceTitle: validated.invoiceTitle,
        regularPrice: validated.regularPrice,
        offerPrice: validated.offerPrice,
        currency: validated.currency,
        subscriptionDuration: validated.subscriptionDuration,
        subscriptionType: validated.subscriptionType,
        autoGenerateInvoice: validated.autoGenerateInvoice,
        featuredImage: validated.featuredImage,
        introVideoUrl: validated.introVideoUrl,
        status: validated.status,
        publishedAt: validated.status === 'PUBLISHED' ? new Date() : validated.publishedAt,
        scheduledAt: validated.scheduledAt,
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
        metaKeywords: validated.metaKeywords,
        isFeatured: validated.isFeatured,
        allowComments: validated.allowComments,
        certificateEnabled: validated.certificateEnabled,
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
    return { success: true, data: course }
  } catch (error) {
    console.error('Create course error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to create course' }
  }
}

