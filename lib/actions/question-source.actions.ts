'use server'

import { requireRole, getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Create Question Source
export async function createQuestionSource(data: {
  name: string
  type: 'BOARD_EXAM' | 'TEXTBOOK' | 'REFERENCE_BOOK' | 'CUSTOM' | 'PREVIOUS_YEAR' | 'MOCK_TEST'
  year?: number
  description?: string
}) {
  // 1. ROLE GUARD
  await requireRole(['ADMIN', 'TEACHER'])

  // 2. TENANT ID
  const tenantId = await getTenantId()

  // 3. ZOD VALIDATION
  const schema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
    type: z.enum(['BOARD_EXAM', 'TEXTBOOK', 'REFERENCE_BOOK', 'CUSTOM', 'PREVIOUS_YEAR', 'MOCK_TEST']),
    year: z.number().min(1900).max(2100).optional(),
    description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  })

  const validated = schema.parse(data)

  // Check duplicate
  const existing = await prisma.questionSource.findFirst({
    where: {
      tenantId,
      name: validated.name,
    },
  })

  if (existing) {
    return { success: false, error: 'Question source with this name already exists' }
  }

  // 4. TENANT ISOLATION
  const source = await prisma.questionSource.create({
    data: {
      ...validated,
      tenantId,
      status: 'ACTIVE',
    },
  })

  // 5. REVALIDATE PATH
  revalidatePath('/question-bank/sources')

  // 6. RETURN CONSISTENT FORMAT
  return { success: true, sourceId: source.id }
}

// Update Question Source
export async function updateQuestionSource(
  id: string,
  data: {
    name?: string
    type?: 'BOARD_EXAM' | 'TEXTBOOK' | 'REFERENCE_BOOK' | 'CUSTOM' | 'PREVIOUS_YEAR' | 'MOCK_TEST'
    year?: number
    description?: string
    status?: 'ACTIVE' | 'INACTIVE'
  }
) {
  // 1. ROLE GUARD
  await requireRole(['ADMIN', 'TEACHER'])

  // 2. TENANT ID
  const tenantId = await getTenantId()

  // 3. ZOD VALIDATION
  const schema = z.object({
    name: z.string().min(1).max(100).optional(),
    type: z.enum(['BOARD_EXAM', 'TEXTBOOK', 'REFERENCE_BOOK', 'CUSTOM', 'PREVIOUS_YEAR', 'MOCK_TEST']).optional(),
    year: z.number().min(1900).max(2100).optional(),
    description: z.string().max(500).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })

  const validated = schema.parse(data)

  // 4. OWNERSHIP CHECK
  const source = await prisma.questionSource.findFirst({
    where: { id, tenantId },
  })

  if (!source) {
    return { success: false, error: 'Question source not found' }
  }

  // Check duplicate name if name is being updated
  if (validated.name && validated.name !== source.name) {
    const existing = await prisma.questionSource.findFirst({
      where: {
        tenantId,
        name: validated.name,
        id: { not: id },
      },
    })

    if (existing) {
      return { success: false, error: 'Question source with this name already exists' }
    }
  }

  // Update
  await prisma.questionSource.update({
    where: { id },
    data: validated,
  })

  // 5. REVALIDATE PATH
  revalidatePath('/question-bank/sources')

  // 6. RETURN CONSISTENT FORMAT
  return { success: true }
}

// Delete Question Source
export async function deleteQuestionSource(id: string) {
  // 1. ROLE GUARD
  await requireRole(['ADMIN', 'TEACHER'])

  // 2. TENANT ID
  const tenantId = await getTenantId()

  // 4. OWNERSHIP CHECK
  const source = await prisma.questionSource.findFirst({
    where: { id, tenantId },
    include: {
      _count: {
        select: { questions: true },
      },
    },
  })

  if (!source) {
    return { success: false, error: 'Question source not found' }
  }

  // Check if source has questions
  if (source._count.questions > 0) {
    return {
      success: false,
      error: `Cannot delete source. It is used by ${source._count.questions} question(s).`,
    }
  }

  // Delete
  await prisma.questionSource.delete({
    where: { id },
  })

  // 5. REVALIDATE PATH
  revalidatePath('/question-bank/sources')

  // 6. RETURN CONSISTENT FORMAT
  return { success: true }
}

// Get Question Sources
export async function getQuestionSources(filters?: {
  type?: 'BOARD_EXAM' | 'TEXTBOOK' | 'REFERENCE_BOOK' | 'CUSTOM' | 'PREVIOUS_YEAR' | 'MOCK_TEST'
  status?: 'ACTIVE' | 'INACTIVE'
  search?: string
}) {
  // 1. ROLE GUARD
  await requireRole(['ADMIN', 'TEACHER'])

  // 2. TENANT ID
  const tenantId = await getTenantId()

  // 4. TENANT ISOLATION
  const sources = await prisma.questionSource.findMany({
    where: {
      tenantId,
      type: filters?.type,
      status: filters?.status,
      name: filters?.search
        ? { contains: filters.search, mode: 'insensitive' }
        : undefined,
    },
    include: {
      _count: {
        select: { questions: true },
      },
    },
    orderBy: [{ type: 'asc' }, { year: 'desc' }, { name: 'asc' }],
  })

  return sources
}

