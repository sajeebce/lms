'use server'

import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const updateStudentSchema = z.object({
  // Student Identity
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').max(100).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.string().max(10).optional().or(z.literal('')),
  photoUrl: z.string().optional().or(z.literal('')),
  presentAddress: z.string().max(200).optional().or(z.literal('')),
  permanentAddress: z.string().max(200).optional().or(z.literal('')),
  rollNumber: z.string().max(50).optional().or(z.literal('')),

  // Login Credentials
  username: z.string().min(3, 'Username must be at least 3 characters').max(50).optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100).optional().or(z.literal('')),

  // Guardians
  guardians: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1).max(100),
        relationship: z.string().min(1).max(50),
        phone: z.string().min(1).max(20),
        email: z.string().email().max(100).optional().or(z.literal('')),
        occupation: z.string().max(100).optional().or(z.literal('')),
        address: z.string().max(200).optional().or(z.literal('')),
        isPrimary: z.boolean(),
      })
    )
    .min(1),

  // Previous School
  previousSchoolName: z.string().max(200).optional().or(z.literal('')),
  previousSchoolAddress: z.string().max(200).optional().or(z.literal('')),
  previousClass: z.string().max(50).optional().or(z.literal('')),
  previousBoard: z.string().max(100).optional().or(z.literal('')),
  tcNumber: z.string().max(50).optional().or(z.literal('')),
  previousAcademicResults: z
    .array(
      z.object({
        examName: z.string().max(100),
        year: z.string().max(4),
        gpa: z.string().max(20).optional().or(z.literal('')),
        grade: z.string().max(50).optional().or(z.literal('')),
      })
    )
    .optional(),
})

export async function updateStudent(studentId: string, data: any) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Validate input
    const validated = updateStudentSchema.parse(data)

    // Ensure at least one primary guardian
    const primaryCount = validated.guardians.filter((g) => g.isPrimary).length
    if (primaryCount === 0) {
      return { success: false, error: 'At least one guardian must be marked as primary' }
    }
    if (primaryCount > 1) {
      return { success: false, error: 'Only one guardian can be marked as primary' }
    }

    // Check if student exists and belongs to tenant
    const existingStudent = await prisma.student.findFirst({
      where: { id: studentId, tenantId },
      include: { guardians: true },
    })

    if (!existingStudent) {
      return { success: false, error: 'Student not found' }
    }

    // Update student in transaction
    await prisma.$transaction(async (tx) => {
      // Update user (username/password)
      if (existingStudent.userId) {
        const userUpdateData: any = {
          name: validated.name,
          email: validated.email || existingStudent.email,
        }

        if (validated.username) {
          userUpdateData.username = validated.username
        }

        if (validated.password) {
          userUpdateData.password = validated.password // TODO: Hash password before storing
        }

        await tx.user.update({
          where: { id: existingStudent.userId },
          data: userUpdateData,
        })
      }

      // Update student
      await tx.student.update({
        where: { id: studentId },
        data: {
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
          previousAcademicResults:
            validated.previousAcademicResults && validated.previousAcademicResults.length > 0
              ? JSON.stringify(validated.previousAcademicResults)
              : null,
        },
      })

      // Get existing guardian IDs
      const existingGuardianIds = existingStudent.guardians.map((g) => g.id)
      const updatedGuardianIds = validated.guardians
        .filter((g) => g.id)
        .map((g) => g.id as string)

      // Delete guardians that are no longer in the list
      const guardiansToDelete = existingGuardianIds.filter(
        (id) => !updatedGuardianIds.includes(id)
      )
      if (guardiansToDelete.length > 0) {
        await tx.guardian.deleteMany({
          where: { id: { in: guardiansToDelete } },
        })
      }

      // Update or create guardians
      for (const guardian of validated.guardians) {
        if (guardian.id) {
          // Update existing guardian
          await tx.guardian.update({
            where: { id: guardian.id },
            data: {
              name: guardian.name,
              relationship: guardian.relationship,
              phone: guardian.phone,
              email: guardian.email || null,
              occupation: guardian.occupation || null,
              address: guardian.address || null,
              isPrimary: guardian.isPrimary,
            },
          })
        } else {
          // Create new guardian
          await tx.guardian.create({
            data: {
              tenantId,
              studentId,
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
      }
    })

    revalidatePath('/students')
    revalidatePath(`/students/${studentId}`)
    revalidatePath(`/students/${studentId}/edit`)

    return { success: true }
  } catch (error: any) {
    console.error('Update student error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: error.message || 'Failed to update student' }
  }
}

