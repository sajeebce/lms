'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'

const admissionSchema = z.object({
  // Student Identity
  name: z.string().min(1).max(100),
  email: z.string().email().max(100).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  dateOfBirth: z.string().min(1),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.string().max(10).optional().or(z.literal('')),
  photoUrl: z.string().optional().or(z.literal('')),
  presentAddress: z.string().max(200).optional().or(z.literal('')),
  permanentAddress: z.string().max(200).optional().or(z.literal('')),

  // Academic Information
  branchId: z.string().optional().or(z.literal('')),
  academicYearId: z.string().min(1),
  classId: z.string().min(1),
  cohortId: z.string().optional().or(z.literal('')),
  sectionId: z.string().min(1),
  rollNumber: z.string().max(50).optional().or(z.literal('')),

  // Guardians
  guardians: z.array(
    z.object({
      name: z.string().min(1).max(100),
      relationship: z.string().min(1).max(50),
      phone: z.string().min(1).max(20),
      email: z.string().email().max(100).optional().or(z.literal('')),
      occupation: z.string().max(100).optional().or(z.literal('')),
      address: z.string().max(200).optional().or(z.literal('')),
      isPrimary: z.boolean().default(false),
    })
  ).min(1),

  // Previous School
  previousSchoolName: z.string().max(200).optional().or(z.literal('')),
  previousSchoolAddress: z.string().max(200).optional().or(z.literal('')),
  previousClass: z.string().max(50).optional().or(z.literal('')),
  previousBoard: z.string().max(100).optional().or(z.literal('')),
  tcNumber: z.string().max(50).optional().or(z.literal('')),
})

export async function admitStudent(data: z.infer<typeof admissionSchema>, enableCohorts: boolean) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = admissionSchema.parse(data)

    // Validate branch is provided when cohorts enabled
    if (enableCohorts && !validated.branchId) {
      return { success: false, error: 'Branch is required when cohorts are enabled' }
    }

    // Validate cohort is provided when cohorts enabled
    if (enableCohorts && !validated.cohortId) {
      return { success: false, error: 'Cohort is required when cohorts are enabled' }
    }

    // Check if email already exists (if provided)
    if (validated.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          tenantId,
          email: validated.email,
        },
      })

      if (existingUser) {
        return { success: false, error: 'User with this email already exists' }
      }
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
      return {
        success: false,
        error: `Section is full (${section._count.enrollments}/${section.capacity})`,
      }
    }

    // Create user, student, guardians, and enrollment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate student ID
      const year = new Date().getFullYear()
      const count = await tx.student.count({ where: { tenantId } })
      const studentId = `STU-${year}-${String(count + 1).padStart(4, '0')}`

      // Create user
      const user = await tx.user.create({
        data: {
          tenantId,
          email: validated.email || `student_${Date.now()}@temp.local`,
          name: validated.name,
          role: 'STUDENT',
        },
      })

      // Create student
      const student = await tx.student.create({
        data: {
          tenantId,
          userId: user.id,
          studentId,
          name: validated.name,
          email: validated.email || null,
          phone: validated.phone || null,
          dateOfBirth: new Date(validated.dateOfBirth),
          gender: validated.gender,
          bloodGroup: validated.bloodGroup || null,
          photoUrl: validated.photoUrl || null,
          presentAddress: validated.presentAddress || null,
          permanentAddress: validated.permanentAddress || null,
          rollNumber: validated.rollNumber || null,
          previousSchoolName: validated.previousSchoolName || null,
          previousSchoolAddress: validated.previousSchoolAddress || null,
          previousClass: validated.previousClass || null,
          previousBoard: validated.previousBoard || null,
          tcNumber: validated.tcNumber || null,
          status: 'ACTIVE',
        },
      })

      // Create guardians
      for (const guardian of validated.guardians) {
        await tx.guardian.create({
          data: {
            tenantId,
            studentId: student.id,
            name: guardian.name,
            relationship: guardian.relationship,
            phone: guardian.phone,
            email: guardian.email || null,
            occupation: guardian.occupation || null,
            address: guardian.address || null,
            isPrimary: guardian.isPrimary,
          },
        })
      }

      // Get branch ID (either from form or first branch if only one exists)
      let branchId = validated.branchId
      if (!branchId) {
        const branches = await tx.branch.findMany({
          where: { tenantId, status: 'ACTIVE' },
          take: 1,
        })
        branchId = branches[0]?.id || ''
      }

      // Create student enrollment
      await tx.studentEnrollment.create({
        data: {
          tenantId,
          studentId: student.id,
          sectionId: validated.sectionId,
          enrollmentType: enableCohorts ? 'COHORT_BASED' : 'DIRECT',
          cohortId: enableCohorts ? validated.cohortId : null,
          academicYearId: validated.academicYearId,
          classId: validated.classId,
          branchId: branchId,
          status: 'ACTIVE',
        },
      })

      return { user, student }
    })

    revalidatePath('/students')
    revalidatePath('/students/admission')
    return { success: true, data: result }
  } catch (error) {
    console.error('Admission error:', error)
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
export async function getAvailableCohorts(yearId: string, classId: string, branchId: string) {
  try {
    const tenantId = await getTenantId()

    const cohorts = await prisma.cohort.findMany({
      where: {
        tenantId,
        yearId,
        classId,
        branchId,
        enrollmentOpen: true,
      },
      orderBy: { name: 'asc' },
    })

    return { success: true, data: cohorts }
  } catch (error) {
    return { success: false, error: 'Failed to fetch cohorts', data: [] }
  }
}

// Get available sections based on cohort or class
export async function getAvailableSections(cohortId?: string, classId?: string) {
  try {
    const tenantId = await getTenantId()

    if (cohortId) {
      // Fetch sections linked to this cohort via junction table
      const cohortSections = await prisma.cohortSection.findMany({
        where: {
          tenantId,
          cohortId,
        },
        include: {
          section: {
            include: {
              _count: {
                select: { enrollments: true },
              },
            },
          },
        },
      })

      const sections = cohortSections.map((cs) => cs.section)
      return { success: true, data: sections }
    } else if (classId) {
      // Fetch all sections (for direct enrollment mode)
      const sections = await prisma.section.findMany({
        where: {
          tenantId,
        },
        include: {
          _count: {
            select: { enrollments: true },
          },
        },
        orderBy: { name: 'asc' },
      })

      return { success: true, data: sections }
    }

    return { success: true, data: [] }
  } catch (error) {
    return { success: false, error: 'Failed to fetch sections', data: [] }
  }
}

