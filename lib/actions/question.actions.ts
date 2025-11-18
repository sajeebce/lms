'use server'

import { requireRole, getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Create Question
export async function createQuestion(data: {
  topicId: string
  questionText: string
  questionType: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'FILL_BLANK' | 'MATCHING'
  options?: { text: string; isCorrect: boolean; explanation?: string }[]
  correctAnswer?: string
  explanation?: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
  marks: number
  negativeMarks?: number
  sourceId?: string
  institutionId?: string
  examYearId?: string
  imageUrl?: string
}) {
  // 1. ROLE GUARD
  await requireRole(['ADMIN', 'TEACHER'])

  // 2. TENANT ID
  const tenantId = await getTenantId()

  // 3. ZOD VALIDATION
  const schema = z.object({
    topicId: z.string().min(1),
    questionText: z
      .string()
      .min(1, 'Question text is required')
      .max(2000, 'Question text must be 2000 characters or less'),
    questionType: z.enum([
      'MCQ',
      'TRUE_FALSE',
      'SHORT_ANSWER',
      'LONG_ANSWER',
      'FILL_BLANK',
      'MATCHING',
    ]),
    options: z
      .array(
        z.object({
          text: z.string().min(1).max(500),
          isCorrect: z.boolean(),
          explanation: z.string().max(5000).optional(),
        })
      )
      .optional(),
    correctAnswer: z.string().max(2000).optional(),
    explanation: z.string().max(10000).optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']),
    marks: z.number().min(0).max(100),
    negativeMarks: z.number().min(0).max(10).optional(),
    sourceId: z.string().optional(),
    institutionId: z.string().optional(),
    examYearId: z.string().optional(),
    imageUrl: z.string().optional(),
  })

  const validated = schema.parse(data)

  // 4. OWNERSHIP CHECK (topic belongs to tenant)
  const topic = await prisma.topic.findFirst({
    where: { id: validated.topicId, tenantId },
  })

  if (!topic) {
    return { success: false, error: 'Topic not found' }
  }

  // Validate institution & exam year belong to this tenant
  if (validated.institutionId) {
    const institution = await prisma.examBoard.findFirst({
      where: { id: validated.institutionId, tenantId },
    })

    if (!institution) {
      return { success: false, error: 'Selected institution/board not found' }
    }
  }

  if (validated.examYearId) {
    const examYear = await prisma.examYear.findFirst({
      where: { id: validated.examYearId, tenantId },
    })

    if (!examYear) {
      return { success: false, error: 'Selected exam year not found' }
    }
  }

  // Validate MCQ options
  if (validated.questionType === 'MCQ') {
    if (!validated.options || validated.options.length < 2) {
      return { success: false, error: 'MCQ must have at least 2 options' }
    }

    const correctCount = validated.options.filter((opt) => opt.isCorrect).length
    if (correctCount === 0) {
      return { success: false, error: 'MCQ must have at least one correct answer' }
    }
  }

  // Validate TRUE_FALSE
  if (validated.questionType === 'TRUE_FALSE') {
    if (!validated.correctAnswer) {
      return { success: false, error: 'True/False question must have a correct answer' }
    }
  }

  // Create question
  const question = await prisma.question.create({
    data: {
      tenantId,
      topicId: validated.topicId,
      questionText: validated.questionText,
      questionType: validated.questionType,
      options: validated.options ? JSON.stringify(validated.options) : null,
      correctAnswer: validated.correctAnswer,
      explanation: validated.explanation,
      difficulty: validated.difficulty,
      marks: validated.marks,
      negativeMarks: validated.negativeMarks || 0,
      sourceId: validated.sourceId,
      institutionId: validated.institutionId,
      examYearId: validated.examYearId,
      imageUrl: validated.imageUrl,
      status: 'ACTIVE',
    },
  })

  // 5. REVALIDATE PATH
  revalidatePath('/question-bank/questions')

  // 6. RETURN CONSISTENT FORMAT
  return { success: true, questionId: question.id }
}

// Update Question
export async function updateQuestion(
  id: string,
  data: {
    topicId?: string
    questionText?: string
    questionType?: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'FILL_BLANK' | 'MATCHING'
    options?: { text: string; isCorrect: boolean; explanation?: string }[]
    correctAnswer?: string
    explanation?: string
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
    marks?: number
    negativeMarks?: number
    sourceId?: string
    institutionId?: string
    examYearId?: string
    imageUrl?: string
    status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  }
) {
  // 1. ROLE GUARD
  await requireRole(['ADMIN', 'TEACHER'])

  // 2. TENANT ID
  const tenantId = await getTenantId()

  // 3. ZOD VALIDATION
  const schema = z.object({
    topicId: z.string().min(1).optional(),
    questionText: z.string().min(1).max(2000).optional(),
    questionType: z
      .enum(['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'LONG_ANSWER', 'FILL_BLANK', 'MATCHING'])
      .optional(),
    options: z
      .array(
        z.object({
          text: z.string().min(1).max(500),
          isCorrect: z.boolean(),
          explanation: z.string().max(5000).optional(),
        })
      )
      .optional(),
    correctAnswer: z.string().max(2000).optional(),
    explanation: z.string().max(10000).optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).optional(),
    marks: z.number().min(0).max(100).optional(),
    negativeMarks: z.number().min(0).max(10).optional(),
    sourceId: z.string().optional(),
    institutionId: z.string().optional(),
    examYearId: z.string().optional(),
    imageUrl: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  })

  const validated = schema.parse(data)

  // 4. OWNERSHIP CHECK
  const question = await prisma.question.findFirst({
    where: { id, tenantId },
  })

  if (!question) {
    return { success: false, error: 'Question not found' }
  }

  // If topicId is being updated, check ownership
  if (validated.topicId) {
    const topic = await prisma.topic.findFirst({
      where: { id: validated.topicId, tenantId },
    })

    if (!topic) {
      return { success: false, error: 'Topic not found' }
    }
  }

  // Validate institution & exam year belong to this tenant when updated
  if (validated.institutionId) {
    const institution = await prisma.examBoard.findFirst({
      where: { id: validated.institutionId, tenantId },
    })

    if (!institution) {
      return { success: false, error: 'Selected institution/board not found' }
    }
  }

  if (validated.examYearId) {
    const examYear = await prisma.examYear.findFirst({
      where: { id: validated.examYearId, tenantId },
    })

    if (!examYear) {
      return { success: false, error: 'Selected exam year not found' }
    }
  }

  // Validate MCQ options if provided
  if (validated.questionType === 'MCQ' || (question.questionType === 'MCQ' && validated.options)) {
    const options = validated.options || (question.options ? JSON.parse(question.options) : [])
    if (options.length < 2) {
      return { success: false, error: 'MCQ must have at least 2 options' }
    }

    const correctCount = options.filter((opt: any) => opt.isCorrect).length
    if (correctCount === 0) {
      return { success: false, error: 'MCQ must have at least one correct answer' }
    }
  }

  // Update question
  await prisma.question.update({
    where: { id },
    data: {
      ...validated,
      options: validated.options ? JSON.stringify(validated.options) : undefined,
    },
  })

  // 5. REVALIDATE PATH
  revalidatePath('/question-bank/questions')

  // 6. RETURN CONSISTENT FORMAT
  return { success: true }
}

// Delete Question
export async function deleteQuestion(id: string) {
  // 1. ROLE GUARD
  await requireRole(['ADMIN', 'TEACHER'])

  // 2. TENANT ID
  const tenantId = await getTenantId()

  // 4. OWNERSHIP CHECK
  const question = await prisma.question.findFirst({
    where: { id, tenantId },
  })

  if (!question) {
    return { success: false, error: 'Question not found' }
  }

  // Delete
  await prisma.question.delete({
    where: { id },
  })

  // 5. REVALIDATE PATH
  revalidatePath('/question-bank/questions')

  // 6. RETURN CONSISTENT FORMAT
  return { success: true }
}

// Get Questions with Filters
export async function getQuestions(filters?: {
  subjectId?: string
  classId?: string
  chapterId?: string
  topicId?: string
  difficulty?: string
  questionType?: string
  sourceId?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  // 1. ROLE GUARD
  await requireRole(['ADMIN', 'TEACHER'])

  // 2. TENANT ID
  const tenantId = await getTenantId()

  const page = filters?.page || 1
  const pageSize = filters?.pageSize || 20
  const skip = (page - 1) * pageSize

  // Build where clause
  const where: any = { tenantId, status: 'ACTIVE' }

  if (filters?.topicId) {
    where.topicId = filters.topicId
  } else if (filters?.chapterId) {
    where.topic = { chapterId: filters.chapterId }
  } else if (filters?.classId && filters?.subjectId) {
    where.topic = {
      chapter: {
        classId: filters.classId,
        subjectId: filters.subjectId,
      },
    }
  }

  if (filters?.difficulty) {
    where.difficulty = filters.difficulty
  }

  if (filters?.questionType) {
    where.questionType = filters.questionType
  }

  if (filters?.sourceId) {
    where.sourceId = filters.sourceId
  }

  if (filters?.search) {
    where.questionText = {
      contains: filters.search,
      mode: 'insensitive',
    }
  }

  // Get questions with pagination
  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      include: {
        topic: {
          include: {
            chapter: {
              include: {
                subject: true,
                class: true,
              },
            },
          },
        },
        source: true,
        institution: true,
        examYear: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.question.count({ where }),
  ])

  return {
    questions,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

