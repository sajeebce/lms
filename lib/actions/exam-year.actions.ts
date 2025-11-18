'use server'

import { requireRole, getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Zod schema for ExamYear
const examYearSchema = z.object({
  year: z
    .number({ invalid_type_error: 'Year is required' })
    .int('Year must be an integer')
    .min(1900, 'Year must be between 1900 and 2100')
    .max(2100, 'Year must be between 1900 and 2100'),
  label: z
    .string()
    .max(100, 'Label must be 100 characters or less')
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export type ExamYearInput = z.infer<typeof examYearSchema>

// Create ExamYear
export async function createExamYear(data: ExamYearInput) {
  await requireRole('ADMIN')
  const tenantId = await getTenantId()

  try {
    const validated = examYearSchema.parse(data)

    // Enforce unique year per tenant
    const existing = await prisma.examYear.findFirst({
      where: {
        tenantId,
        year: validated.year,
      },
    })

    if (existing) {
      return { success: false, error: 'This exam year already exists' }
    }

    const year = await prisma.examYear.create({
      data: {
        tenantId,
        year: validated.year,
        label: validated.label,
        status: validated.status ?? 'ACTIVE',
      },
      include: {
        _count: { select: { questions: true } },
      },
    })

    revalidatePath('/question-bank/years')

    return { success: true, data: year }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation error',
      }
    }

    return { success: false, error: 'Failed to create exam year' }
  }
}

// Update ExamYear
export async function updateExamYear(id: string, data: Partial<ExamYearInput>) {
  await requireRole('ADMIN')
  const tenantId = await getTenantId()

  try {
    const validated = examYearSchema.partial().parse(data)

    const existingYear = await prisma.examYear.findFirst({
      where: { id, tenantId },
    })

    if (!existingYear) {
      return { success: false, error: 'Exam year not found' }
    }

    if (
      typeof validated.year === 'number' &&
      validated.year !== existingYear.year
    ) {
      const duplicate = await prisma.examYear.findFirst({
        where: {
          tenantId,
          year: validated.year,
          id: { not: id },
        },
      })

      if (duplicate) {
        return { success: false, error: 'Another exam year with this value already exists' }
      }
    }

    const updated = await prisma.examYear.update({
      where: { id },
      data: validated,
      include: {
        _count: { select: { questions: true } },
      },
    })

    revalidatePath('/question-bank/years')

    return { success: true, data: updated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation error',
      }
    }

    return { success: false, error: 'Failed to update exam year' }
  }
}

// Delete ExamYear
export async function deleteExamYear(id: string) {
  await requireRole('ADMIN')
  const tenantId = await getTenantId()

  const year = await prisma.examYear.findFirst({
    where: { id, tenantId },
    include: {
      _count: { select: { questions: true } },
    },
  })

  if (!year) {
    return { success: false, error: 'Exam year not found' }
  }

  if (year._count.questions > 0) {
    return {
      success: false,
      error: `Cannot delete exam year. It is used by ${year._count.questions} question(s).`,
    }
  }

  await prisma.examYear.delete({ where: { id } })

  revalidatePath('/question-bank/years')

  return { success: true }
}

// Get ExamYears
export async function getExamYears(filters?: {
  status?: 'ACTIVE' | 'INACTIVE'
  search?: string
}) {
  await requireRole(['ADMIN', 'TEACHER'])
  const tenantId = await getTenantId()

  const where: any = { tenantId }

  if (filters?.status) {
    where.status = filters.status
  }

  if (filters?.search) {
    const search = filters.search.trim()
    const maybeYear = Number.parseInt(search, 10)

    where.OR = [
      { label: { contains: search, mode: 'insensitive' } },
    ]

    if (!Number.isNaN(maybeYear)) {
      where.OR.push({ year: maybeYear })
    }
  }

  const years = await prisma.examYear.findMany({
    where,
    include: {
      _count: { select: { questions: true } },
    },
    orderBy: { year: 'desc' },
  })

  return years
}

