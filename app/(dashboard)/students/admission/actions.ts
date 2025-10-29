'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'

// Validation schema for student admission
const admissionSchema = z.object({
  // Personal Info
  fullName: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  address: z.string().optional(),
  fatherName: z.string().optional(),
  fatherPhone: z.string().optional(),

  // Academic Setup
  branchId: z.string().optional(), // Required when cohorts enabled
  yearId: z.string().min(1, 'Academic year is required'),
  classId: z.string().min(1, 'Class is required'),
  streamId: z.string().optional(),
  sectionId: z.string().min(1, 'Section is required'),
  cohortId: z.string().optional(), // Optional if cohorts disabled
})

export async function admitStudent(data: z.infer<typeof admissionSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = admissionSchema.parse(data)

    // Get tenant settings to check if cohorts are enabled
    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    })
    const enableCohorts = tenantSettings?.enableCohorts ?? true

    // Validate branch is provided when cohorts enabled
    if (enableCohorts && !validated.branchId) {
      return { success: false, error: 'Branch is required' }
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        tenantId,
        email: validated.email,
      },
    })

    if (existingUser) {
      return { success: false, error: 'User with this email already exists' }
    }

    // Check section capacity
    const section = await prisma.section.findUnique({
      where: { id: validated.sectionId },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    })

    if (!section) {
      return { success: false, error: 'Section not found' }
    }

    // Check capacity (0 = unlimited)
    if (section.capacity > 0 && section._count.enrollments >= section.capacity) {
      return { success: false, error: `Section is full (${section.capacity}/${section._count.enrollments})` }
    }

    // Create user and student in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          tenantId,
          email: validated.email,
          name: validated.fullName,
          role: 'STUDENT',
        },
      })

      // Create student
      const student = await tx.student.create({
        data: {
          tenantId,
          userId: user.id,
          dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : null,
          gender: validated.gender || null,
          address: validated.address || null,
          fatherName: validated.fatherName || null,
          fatherPhone: validated.fatherPhone || null,
          status: 'ACTIVE',
        },
      })

      // Create student enrollment
      await tx.studentEnrollment.create({
        data: {
          tenantId,
          studentId: student.id,
          sectionId: validated.sectionId,
          status: 'ACTIVE',
        },
      })

      return { user, student }
    })

    revalidatePath('/students')
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to admit student' }
  }
}

// Get available cohorts based on filters
export async function getAvailableCohorts(
  yearId: string,
  classId: string,
  streamId?: string,
  branchId?: string
) {
  try {
    const tenantId = await getTenantId()

    // Build where clause dynamically
    const whereClause: any = {
      tenantId,
      yearId,
      classId,
      enrollmentOpen: true, // Only show cohorts with enrollment open
    }

    // Add optional filters
    if (streamId) {
      whereClause.streamId = streamId
    }
    if (branchId) {
      whereClause.branchId = branchId
    }

    const cohorts = await prisma.cohort.findMany({
      where: whereClause,
      include: {
        year: true,
        class: true,
        stream: true,
        branch: true,
      },
      orderBy: { name: 'asc' },
    })

    return { success: true, data: cohorts }
  } catch (error) {
    return { success: false, error: 'Failed to fetch cohorts' }
  }
}

// Get available sections based on cohort
export async function getAvailableSections(cohortId: string) {
  try {
    const tenantId = await getTenantId()

    const sections = await prisma.section.findMany({
      where: {
        tenantId,
        cohortId,
      },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    })

    return { success: true, data: sections }
  } catch (error) {
    return { success: false, error: 'Failed to fetch sections' }
  }
}

