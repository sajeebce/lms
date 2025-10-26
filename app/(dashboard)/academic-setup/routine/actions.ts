'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole, getCurrentUser } from '@/lib/auth'

const routineSchema = z.object({
  sectionId: z.string().min(1, 'Section is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
  roomId: z.string().min(1, 'Room is required'),
  courseId: z.string().optional(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
})

// Helper to check time overlap
function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const [h1, m1] = start1.split(':').map(Number)
  const [h2, m2] = end1.split(':').map(Number)
  const [h3, m3] = start2.split(':').map(Number)
  const [h4, m4] = end2.split(':').map(Number)

  const start1Min = h1 * 60 + m1
  const end1Min = h2 * 60 + m2
  const start2Min = h3 * 60 + m3
  const end2Min = h4 * 60 + m4

  return start1Min < end2Min && start2Min < end1Min
}

export async function createRoutine(data: z.infer<typeof routineSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const user = await getCurrentUser()
    const validated = routineSchema.parse(data)

    // Validate time range
    if (validated.startTime >= validated.endTime) {
      return { success: false, error: 'End time must be after start time' }
    }

    // Check for conflicts
    const existingRoutines = await prisma.routine.findMany({
      where: {
        tenantId,
        dayOfWeek: validated.dayOfWeek,
      },
      include: {
        teacher: true,
        room: true,
        section: true,
      },
    })

    for (const routine of existingRoutines) {
      if (
        timesOverlap(
          validated.startTime,
          validated.endTime,
          routine.startTime,
          routine.endTime
        )
      ) {
        // Check teacher conflict
        if (routine.teacherId === validated.teacherId) {
          return {
            success: false,
            error: `Conflict: ${routine.teacher.name} already booked at this time`,
          }
        }
        // Check room conflict
        if (routine.roomId === validated.roomId) {
          return {
            success: false,
            error: `Conflict: ${routine.room.name} already booked at this time`,
          }
        }
        // Check section conflict
        if (routine.sectionId === validated.sectionId) {
          return {
            success: false,
            error: `Conflict: ${routine.section.name} already has a class at this time`,
          }
        }
      }
    }

    await prisma.routine.create({
      data: {
        ...validated,
        tenantId,
        courseId: validated.courseId || null,
        createdByUserId: user.id,
      },
    })

    revalidatePath('/academic-setup/routine')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to create routine' }
  }
}

export async function updateRoutine(
  id: string,
  data: z.infer<typeof routineSchema>
) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = routineSchema.parse(data)

    // Validate time range
    if (validated.startTime >= validated.endTime) {
      return { success: false, error: 'End time must be after start time' }
    }

    // Check for conflicts (excluding current routine)
    const existingRoutines = await prisma.routine.findMany({
      where: {
        tenantId,
        dayOfWeek: validated.dayOfWeek,
        id: { not: id },
      },
      include: {
        teacher: true,
        room: true,
        section: true,
      },
    })

    for (const routine of existingRoutines) {
      if (
        timesOverlap(
          validated.startTime,
          validated.endTime,
          routine.startTime,
          routine.endTime
        )
      ) {
        if (routine.teacherId === validated.teacherId) {
          return {
            success: false,
            error: `Conflict: ${routine.teacher.name} already booked at this time`,
          }
        }
        if (routine.roomId === validated.roomId) {
          return {
            success: false,
            error: `Conflict: ${routine.room.name} already booked at this time`,
          }
        }
        if (routine.sectionId === validated.sectionId) {
          return {
            success: false,
            error: `Conflict: ${routine.section.name} already has a class at this time`,
          }
        }
      }
    }

    await prisma.routine.update({
      where: { id, tenantId },
      data: {
        ...validated,
        courseId: validated.courseId || null,
      },
    })

    revalidatePath('/academic-setup/routine')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to update routine' }
  }
}

export async function deleteRoutine(id: string) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    await prisma.routine.delete({
      where: { id, tenantId },
    })

    revalidatePath('/academic-setup/routine')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to delete routine' }
  }
}

