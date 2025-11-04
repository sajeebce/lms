'use server'

import { requireRole, getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const bundleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().min(1, 'Slug is required').max(200),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  selectedCourseIds: z.array(z.string()).min(1, 'At least one course is required'),
  regularPrice: z.number().min(0),
  offerPrice: z.number().min(0).optional(),
  currency: z.string().default('BDT'),
  status: z.enum(['DRAFT', 'PUBLISHED']),
})

export async function createBundleCourse(data: z.infer<typeof bundleSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Validate
    const validated = bundleSchema.parse(data)

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

    // Create bundle course with child courses
    const bundle = await prisma.course.create({
      data: {
        tenantId,
        courseType: 'BUNDLE',
        title: validated.title,
        slug: validated.slug,
        categoryId: validated.categoryId || null,
        description: validated.description,
        shortDescription: validated.shortDescription,
        paymentType: 'ONE_TIME',
        regularPrice: validated.regularPrice,
        offerPrice: validated.offerPrice,
        currency: validated.currency,
        status: validated.status,
        publishedAt: validated.status === 'PUBLISHED' ? new Date() : null,
        bundleChild: {
          create: validated.selectedCourseIds.map((courseId, index) => ({
            tenantId,
            childCourseId: courseId,
            order: index + 1,
          })),
        },
      },
    })

    revalidatePath('/course-management/courses')
    return { success: true, data: bundle }
  } catch (error) {
    console.error('Create bundle error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to create bundle' }
  }
}

