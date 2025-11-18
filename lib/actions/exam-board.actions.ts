'use server'

import { requireRole, getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Zod schema for ExamBoard
const examBoardSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  code: z.string().max(20, 'Code must be 20 characters or less').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

type ExamBoardInput = z.infer<typeof examBoardSchema>

// Create ExamBoard
export async function createExamBoard(data: ExamBoardInput) {
  await requireRole('ADMIN')
  const tenantId = await getTenantId()

  try {
    const validated = examBoardSchema.parse(data)

    // Check duplicate name per tenant
    const existing = await prisma.examBoard.findFirst({
      where: {
        tenantId,
        name: validated.name,
      },
    })

    if (existing) {
      return { success: false, error: 'Board with this name already exists' }
    }

    // Optional: ensure code is unique per tenant
    if (validated.code) {
      const existingCode = await prisma.examBoard.findFirst({
        where: {
          tenantId,
          code: validated.code,
        },
      })

      if (existingCode) {
        return { success: false, error: 'Board with this code already exists' }
      }
    }

    const board = await prisma.examBoard.create({
      data: {
        ...validated,
        tenantId,
        status: validated.status ?? 'ACTIVE',
      },
      include: {
        _count: {
          select: { questionSources: true },
        },
      },
    })

    revalidatePath('/question-bank/boards')

    return { success: true, data: board }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Validation error' }
    }
    return { success: false, error: 'Failed to create board' }
  }
}

// Update ExamBoard
export async function updateExamBoard(id: string, data: ExamBoardInput) {
  await requireRole('ADMIN')
  const tenantId = await getTenantId()

  try {
    const validated = examBoardSchema.partial().parse(data)

    const board = await prisma.examBoard.findFirst({
      where: { id, tenantId },
    })

    if (!board) {
      return { success: false, error: 'Board not found' }
    }

    if (validated.name && validated.name !== board.name) {
      const existing = await prisma.examBoard.findFirst({
        where: {
          tenantId,
          name: validated.name,
          id: { not: id },
        },
      })

      if (existing) {
        return { success: false, error: 'Board with this name already exists' }
      }
    }

    if (validated.code && validated.code !== board.code) {
      const existingCode = await prisma.examBoard.findFirst({
        where: {
          tenantId,
          code: validated.code,
          id: { not: id },
        },
      })

      if (existingCode) {
        return { success: false, error: 'Board with this code already exists' }
      }
    }

    const updated = await prisma.examBoard.update({
      where: { id },
      data: validated,
      include: {
        _count: {
          select: { questionSources: true },
        },
      },
    })

    revalidatePath('/question-bank/boards')

    return { success: true, data: updated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Validation error' }
    }
    return { success: false, error: 'Failed to update board' }
  }
}

// Delete ExamBoard
export async function deleteExamBoard(id: string) {
  await requireRole('ADMIN')
  const tenantId = await getTenantId()

  const board = await prisma.examBoard.findFirst({
    where: { id, tenantId },
    include: {
      _count: {
        select: { questionSources: true },
      },
    },
  })

  if (!board) {
    return { success: false, error: 'Board not found' }
  }

  if (board._count.questionSources > 0) {
    return {
      success: false,
      error: `Cannot delete board. It is used by ${board._count.questionSources} source(s).`,
    }
  }

  await prisma.examBoard.delete({
    where: { id },
  })

  revalidatePath('/question-bank/boards')

  return { success: true }
}

// Get ExamBoards
export async function getExamBoards(filters?: {
  status?: 'ACTIVE' | 'INACTIVE'
  search?: string
}) {
  await requireRole(['ADMIN', 'TEACHER'])
  const tenantId = await getTenantId()

  const boards = await prisma.examBoard.findMany({
    where: {
      tenantId,
      status: filters?.status,
      name: filters?.search
        ? { contains: filters.search, mode: 'insensitive' }
        : undefined,
    },
    include: {
      _count: {
        select: { questionSources: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return boards
}

