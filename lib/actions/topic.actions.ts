'use server'

import { requireRole, getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Zod schema for validation
const topicSchema = z.object({
  chapterId: z.string().min(1, 'Chapter is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  code: z.string().max(20, 'Code must be 20 characters or less').optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  order: z.number().min(0).max(9999).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

type TopicInput = z.infer<typeof topicSchema>

// Get topics with optional filters
export async function getTopics(options: {
  subjectId?: string
  classId?: string
  chapterId?: string
  status?: 'ACTIVE' | 'INACTIVE'
} = {}) {
  const tenantId = await getTenantId()

  const topics = await prisma.topic.findMany({
    where: {
      tenantId,
      ...(options.chapterId && { chapterId: options.chapterId }),
      ...(options.status && { status: options.status }),
      ...(options.subjectId && {
        chapter: {
          subjectId: options.subjectId,
        },
      }),
      ...(options.classId && {
        chapter: {
          classId: options.classId,
        },
      }),
    },
    include: {
      chapter: {
        select: {
          id: true,
          name: true,
          code: true,
          subject: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
              alias: true,
            },
          },
        },
      },
      _count: {
        select: {
          questions: true,
        },
      },
    },
    orderBy: [
      { chapter: { subject: { name: 'asc' } } },
      { chapter: { class: { order: 'asc' } } },
      { chapter: { order: 'asc' } },
      { order: 'asc' },
      { name: 'asc' },
    ],
  })

  return topics
}

// Get single topic by ID
export async function getTopicById(id: string) {
  const tenantId = await getTenantId()

  const topic = await prisma.topic.findFirst({
    where: {
      id,
      tenantId,
    },
    include: {
      chapter: {
        select: {
          id: true,
          name: true,
          code: true,
          subject: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
              alias: true,
            },
          },
        },
      },
      _count: {
        select: {
          questions: true,
        },
      },
    },
  })

  return topic
}

// Create topic
export async function createTopic(data: TopicInput) {
  await requireRole('ADMIN')
  const tenantId = await getTenantId()

  // Validate input
  const validated = topicSchema.parse(data)

  // Check for duplicate topic name in same chapter
  const existing = await prisma.topic.findFirst({
    where: {
      tenantId,
      chapterId: validated.chapterId,
      name: validated.name,
    },
  })

  if (existing) {
    return {
      success: false,
      error: 'A topic with this name already exists in this chapter. Please use a different name.',
    }
  }

  // Auto-increment order if not provided
  let order = validated.order
  if (order === undefined) {
    const lastTopic = await prisma.topic.findFirst({
      where: {
        tenantId,
        chapterId: validated.chapterId,
      },
      orderBy: {
        order: 'desc',
      },
    })
    order = lastTopic ? lastTopic.order + 1 : 0
  }

  // Create topic
  const topic = await prisma.topic.create({
    data: {
      ...validated,
      order,
      tenantId,
      status: validated.status || 'ACTIVE',
    },
    include: {
      chapter: {
        select: {
          id: true,
          name: true,
          subject: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
              alias: true,
            },
          },
        },
      },
    },
  })

  revalidatePath('/question-bank/topics')
  return { success: true, data: topic }
}

// Update topic
export async function updateTopic(id: string, data: TopicInput) {
  await requireRole('ADMIN')
  const tenantId = await getTenantId()

  // Validate input
  const validated = topicSchema.parse(data)

  // Check if topic exists
  const topic = await prisma.topic.findFirst({
    where: {
      id,
      tenantId,
    },
  })

  if (!topic) {
    return { success: false, error: 'Topic not found' }
  }

  // Check for duplicate name (excluding current topic)
  const existing = await prisma.topic.findFirst({
    where: {
      tenantId,
      chapterId: validated.chapterId,
      name: validated.name,
      id: {
        not: id,
      },
    },
  })

  if (existing) {
    return {
      success: false,
      error: 'A topic with this name already exists in this chapter. Please use a different name.',
    }
  }

  // Update topic
  const updatedTopic = await prisma.topic.update({
    where: { id },
    data: {
      ...validated,
      status: validated.status || topic.status,
    },
    include: {
      chapter: {
        select: {
          id: true,
          name: true,
          subject: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
              alias: true,
            },
          },
        },
      },
    },
  })

  revalidatePath('/question-bank/topics')
  return { success: true, data: updatedTopic }
}

// Delete topic
export async function deleteTopic(id: string) {
  await requireRole('ADMIN')
  const tenantId = await getTenantId()

  // Check if topic exists
  const topic = await prisma.topic.findFirst({
    where: {
      id,
      tenantId,
    },
    include: {
      _count: {
        select: {
          questions: true,
        },
      },
    },
  })

  if (!topic) {
    return { success: false, error: 'Topic not found' }
  }

  // Prevent deletion if questions exist
  if (topic._count.questions > 0) {
    return {
      success: false,
      error: `Cannot delete topic. It has ${topic._count.questions} question(s) associated with it. Please delete or reassign the questions first.`,
    }
  }

  // Delete topic
  await prisma.topic.delete({
    where: { id },
  })

  revalidatePath('/question-bank/topics')
  return { success: true }
}

