'use server'

import { requireRole, getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================
// VALIDATION SCHEMAS
// ============================================

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  icon: z.string().max(50, 'Icon must be 50 characters or less').optional(),
  color: z.string().max(20, 'Color must be 20 characters or less').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  parentId: z.string().optional().nullable(),
})

// ============================================
// CREATE CATEGORY
// ============================================

export async function createCategory(data: {
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  status?: string
  parentId?: string | null
}) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Validate input
    const validated = categorySchema.parse(data)

    // Check if slug already exists
    const existing = await prisma.courseCategory.findFirst({
      where: {
        tenantId,
        slug: validated.slug,
      },
    })

    if (existing) {
      return { success: false, error: 'A category with this slug already exists' }
    }

    // Get max order
    const maxOrder = await prisma.courseCategory.findFirst({
      where: { tenantId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    // Create category
    const category = await prisma.courseCategory.create({
      data: {
        ...validated,
        tenantId,
        order: (maxOrder?.order ?? 0) + 1,
      },
    })

    revalidatePath('/course-management/categories')
    return { success: true, data: category }
  } catch (error) {
    console.error('Create category error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to create category' }
  }
}

// ============================================
// UPDATE CATEGORY
// ============================================

export async function updateCategory(
  id: string,
  data: {
    name: string
    slug: string
    description?: string
    icon?: string
    color?: string
    status?: string
    parentId?: string | null
  }
) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Validate input
    const validated = categorySchema.parse(data)

    // Check if slug already exists (excluding current category)
    const existing = await prisma.courseCategory.findFirst({
      where: {
        tenantId,
        slug: validated.slug,
        NOT: { id },
      },
    })

    if (existing) {
      return { success: false, error: 'A category with this slug already exists' }
    }

    // Update category
    const category = await prisma.courseCategory.update({
      where: { id },
      data: validated,
    })

    revalidatePath('/course-management/categories')
    return { success: true, data: category }
  } catch (error) {
    console.error('Update category error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to update category' }
  }
}

// ============================================
// DELETE CATEGORY
// ============================================

export async function deleteCategory(id: string) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Check if category has courses or children
    const category = await prisma.courseCategory.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { courses: true, children: true },
        },
      },
    })

    if (!category) {
      return { success: false, error: 'Category not found' }
    }

    if (category._count.courses > 0) {
      return {
        success: false,
        error: `Cannot delete: This category has ${category._count.courses} course${
          category._count.courses > 1 ? 's' : ''
        }. Please reassign or delete them first.`,
      }
    }

    if (category._count.children > 0) {
      return {
        success: false,
        error: `Cannot delete: This category has ${category._count.children} subcategor${
          category._count.children > 1 ? 'ies' : 'y'
        }. Please reassign or delete them first.`,
      }
    }

    // Delete category
    await prisma.courseCategory.delete({
      where: { id },
    })

    revalidatePath('/course-management/categories')
    return { success: true }
  } catch (error) {
    console.error('Delete category error:', error)
    return { success: false, error: 'Failed to delete category' }
  }
}

// ============================================
// REORDER CATEGORIES
// ============================================

export async function reorderCategories(categoryIds: string[]) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Update order for each category
    await Promise.all(
      categoryIds.map((id, index) =>
        prisma.courseCategory.update({
          where: { id },
          data: { order: index + 1 },
        })
      )
    )

    revalidatePath('/course-management/categories')
    return { success: true }
  } catch (error) {
    console.error('Reorder categories error:', error)
    return { success: false, error: 'Failed to reorder categories' }
  }
}

// ============================================
// GET CATEGORIES
// ============================================

export async function getCategories() {
  try {
    const tenantId = await getTenantId()

    const categories = await prisma.courseCategory.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { courses: true },
        },
      },
      orderBy: { order: 'asc' },
    })

    return { success: true, data: categories }
  } catch (error) {
    console.error('Get categories error:', error)
    return { success: false, error: 'Failed to fetch categories', data: [] }
  }
}

