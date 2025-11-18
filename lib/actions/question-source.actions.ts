'use server'

import { requireRole, getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const questionSourceBaseSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  type: z.enum([
    'BOARD_EXAM',
    'TEXTBOOK',
    'REFERENCE_BOOK',
    'CUSTOM',
    'PREVIOUS_YEAR',
    'MOCK_TEST',
  ]),
  boardId: z.string().min(1, 'Board is required').optional(),
  year: z
    .number()
    .int()
    .min(1900, 'Year must be 1900 or later')
    .max(2100, 'Year must be 2100 or earlier')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

const createQuestionSourceSchema = questionSourceBaseSchema.superRefine((value, ctx) => {
  if (value.type === 'BOARD_EXAM') {
    if (!value.boardId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['boardId'],
        message: 'Board is required for board exam sources',
      })
    }
    if (value.year == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['year'],
        message: 'Year is required for board exam sources',
      })
    }
  }
})

const updateQuestionSourceSchema = questionSourceBaseSchema.partial()

type CreateQuestionSourceInput = z.infer<typeof createQuestionSourceSchema>

type UpdateQuestionSourceInput = z.infer<typeof updateQuestionSourceSchema>


// Create Question Source
export async function createQuestionSource(data: CreateQuestionSourceInput) {
  // 1. ROLE GUARD
  await requireRole(['ADMIN', 'TEACHER'])

  // 2. TENANT ID
  const tenantId = await getTenantId()

  // 3. ZOD VALIDATION
  const validated = createQuestionSourceSchema.parse(data)

  const isBoardBased = validated.type === 'BOARD_EXAM'

  // 4. Uniqueness checks
  if (isBoardBased) {
    if (!validated.boardId || validated.year == null) {
      return {
        success: false,
        error: 'Board and year are required for board exam sources',
      }
    }

    const existing = await prisma.questionSource.findFirst({
      where: {
        tenantId,
        boardId: validated.boardId,
        year: validated.year,
      },
    })

    if (existing) {
      return {
        success: false,
        error: 'A source for this board and year already exists',
      }
    }
  } else {
    const existing = await prisma.questionSource.findFirst({
      where: {
        tenantId,
        name: validated.name,
        type: validated.type,
        year: validated.year ?? null,
      },
    })

    if (existing) {
      return {
        success: false,
        error: 'Question source with this name, type and year already exists',
      }
    }
  }

  // 5. Create source (tenant-scoped)
  const source = await prisma.questionSource.create({
    data: {
      name: validated.name,
      type: validated.type,
      boardId: isBoardBased ? validated.boardId : null,
      year: validated.year ?? null,
      description: validated.description ?? null,
      status: validated.status ?? 'ACTIVE',
      tenantId,
    },
    include: {
      board: true,
      _count: {
        select: { questions: true },
      },
    },
  })

  // 6. REVALIDATE PATH
  revalidatePath('/question-bank/sources')

  return { success: true, data: source }
}

// Update Question Source
export async function updateQuestionSource(
  id: string,
  data: UpdateQuestionSourceInput,
) {
  // 1. ROLE GUARD
  await requireRole(['ADMIN', 'TEACHER'])

  // 2. TENANT ID
  const tenantId = await getTenantId()

  // 3. ZOD VALIDATION
  const validated = updateQuestionSourceSchema.parse(data)

  // 4. OWNERSHIP CHECK
  const source = await prisma.questionSource.findFirst({
    where: { id, tenantId },
  })

  if (!source) {
    return { success: false, error: 'Question source not found' }
  }

  const target = {
    name: validated.name ?? source.name,
    type: validated.type ?? source.type,
    boardId:
      validated.boardId !== undefined ? validated.boardId : source.boardId,
    year:
      validated.year !== undefined ? validated.year : source.year,
  }

  if (target.type === 'BOARD_EXAM') {
    if (!target.boardId || target.year == null) {
      return {
        success: false,
        error: 'Board and year are required for board exam sources',
      }
    }

    const existing = await prisma.questionSource.findFirst({
      where: {
        tenantId,
        boardId: target.boardId,
        year: target.year,
        id: { not: id },
      },
    })

    if (existing) {
      return {
        success: false,
        error: 'A source for this board and year already exists',
      }
    }
  } else {
    const existing = await prisma.questionSource.findFirst({
      where: {
        tenantId,
        name: target.name,
        type: target.type,
        year: target.year ?? null,
        id: { not: id },
      },
    })

    if (existing) {
      return {
        success: false,
        error: 'Question source with this name, type and year already exists',
      }
    }
  }

  const updated = await prisma.questionSource.update({
    where: { id },
    data: {
      name: target.name,
      type: target.type,
      boardId: target.type === 'BOARD_EXAM' ? target.boardId : null,
      year: target.year ?? null,
      description: validated.description ?? source.description,
      status: validated.status ?? source.status,
    },
    include: {
      board: true,
      _count: {
        select: { questions: true },
      },
    },
  })

  // 5. REVALIDATE PATH
  revalidatePath('/question-bank/sources')

  return { success: true, data: updated }
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
      board: true,
      _count: {
        select: { questions: true },
      },
    },
    orderBy: [{ type: 'asc' }, { year: 'desc' }, { name: 'asc' }],
  })

  return sources
}

