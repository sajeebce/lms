'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'
import { StorageService } from '@/lib/storage/storage-service'
import { promises as fs } from 'fs'
import path from 'path'

// Check for duplicate phone or email
export async function checkDuplicateContact(phone?: string, email?: string) {
  try {
    const tenantId = await getTenantId()

    if (!phone && !email) {
      return { exists: false }
    }

    const conditions: any[] = []
    if (phone) {
      conditions.push({ phone })
    }
    if (email) {
      conditions.push({ email })
    }

    const existingStudent = await prisma.student.findFirst({
      where: {
        tenantId,
        OR: conditions,
      },
      select: {
        id: true,
        name: true,
        studentId: true,
        phone: true,
        email: true,
        status: true,
      },
    })

    if (existingStudent) {
      // Determine which field(s) matched
      const matchedFields: string[] = []
      if (phone && existingStudent.phone === phone) {
        matchedFields.push('phone')
      }
      if (email && existingStudent.email === email) {
        matchedFields.push('email')
      }

      return {
        exists: true,
        student: existingStudent,
        matchedFields, // ['phone'], ['email'], or ['phone', 'email']
      }
    }

    return { exists: false }
  } catch (error) {
    console.error('Check duplicate error:', error)
    return { exists: false }
  }
}

// Generate unique username from name
export async function generateUsername(name: string) {
  try {
    const tenantId = await getTenantId()

    // Clean name: lowercase, remove spaces, keep only alphanumeric
    const baseName = name
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20) // Max 20 chars

    if (!baseName) {
      return { success: false, username: '' }
    }

    // Check if base username exists
    const existingUser = await prisma.user.findFirst({
      where: {
        tenantId,
        username: baseName,
      },
    })

    if (!existingUser) {
      return { success: true, username: baseName }
    }

    // If exists, try with numbers (1-999)
    for (let i = 1; i <= 999; i++) {
      const username = `${baseName}${i}`
      const exists = await prisma.user.findFirst({
        where: {
          tenantId,
          username,
        },
      })

      if (!exists) {
        return { success: true, username }
      }
    }

    // If all taken, use timestamp
    const timestamp = Date.now().toString().slice(-6)
    return { success: true, username: `${baseName}${timestamp}` }
  } catch (error) {
    console.error('Generate username error:', error)
    return { success: false, username: '' }
  }
}

// Upload student photo (temporary - before student is created)
export async function uploadStudentPhotoTemp(formData: FormData) {
  try {
    const file = formData.get('photo') as File
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' }
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'File size must be less than 5MB' }
    }

    // Generate temporary filename
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const extension = file.name.split('.').pop() || 'jpg'
    const tempFileName = `${tempId}.${extension}`

    // Create temp directory if not exists
    const tempDir = path.join(process.cwd(), 'storage', 'temp')
    await fs.mkdir(tempDir, { recursive: true })

    // Save file temporarily
    const tempPath = path.join(tempDir, tempFileName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(tempPath, buffer)

    // Return temp file info
    return {
      success: true,
      tempFileName,
      tempPath,
      url: `/api/storage/temp/${tempFileName}`,
    }
  } catch (error: any) {
    console.error('Upload photo error:', error)
    return { success: false, error: error.message || 'Failed to upload photo' }
  }
}

const admissionSchema = z.object({
  // Student Identity
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().min(1, 'Email is required').email('Invalid email').max(100),
  phone: z.string().min(1, 'Phone number is required').max(20),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { required_error: 'Gender is required' }),
  bloodGroup: z.string().max(10).optional().or(z.literal('')),
  photoUrl: z.string().optional().or(z.literal('')),
  presentAddress: z.string().max(200).optional().or(z.literal('')),
  permanentAddress: z.string().max(200).optional().or(z.literal('')),

  // Login Credentials
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),

  // Academic Information
  branchId: z.string().optional().or(z.literal('')),
  academicYearId: z.string().min(1, 'Academic year is required'),
  classId: z.string().min(1, 'Class is required'),
  cohortId: z.string().optional().or(z.literal('')),
  sectionId: z.string().min(1, 'Section is required'),
  rollNumber: z.string().max(50).optional().or(z.literal('')),

  // Guardians
  guardians: z.array(
    z.object({
      name: z.string().min(1, 'Guardian name is required').max(100),
      relationship: z.string().min(1, 'Relationship is required').max(50),
      phone: z.string().min(1, 'Phone is required').max(20),
      email: z.string().email('Invalid email').max(100).optional().or(z.literal('')),
      occupation: z.string().max(100).optional().or(z.literal('')),
      address: z.string().max(200).optional().or(z.literal('')),
      isPrimary: z.boolean().default(false),
    })
  ).min(1, 'At least one guardian is required'),

  // Previous School
  previousSchoolName: z.string().max(200).optional().or(z.literal('')),
  previousSchoolAddress: z.string().max(200).optional().or(z.literal('')),
  previousClass: z.string().max(50).optional().or(z.literal('')),
  previousBoard: z.string().max(100).optional().or(z.literal('')),
  tcNumber: z.string().max(50).optional().or(z.literal('')),
  previousAcademicResults: z.array(
    z.object({
      examName: z.string().max(100),
      year: z.string().max(4),
      gpa: z.string().max(20).optional().or(z.literal('')),
      grade: z.string().max(50).optional().or(z.literal('')),
    })
  ).optional(),
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

    // Handle photo upload if temp file exists
    let finalPhotoUrl: string | null = null
    if (validated.photoUrl && validated.photoUrl.startsWith('/api/storage/temp/')) {
      // Extract temp filename from URL
      const tempFileName = validated.photoUrl.split('/').pop()
      if (tempFileName) {
        const tempPath = path.join(process.cwd(), 'storage', 'temp', tempFileName)

        try {
          // Check if temp file exists
          await fs.access(tempPath)

          // We'll move the file after student is created (need student ID)
          // For now, keep the temp path
          finalPhotoUrl = validated.photoUrl
        } catch {
          // Temp file doesn't exist, ignore
          finalPhotoUrl = null
        }
      }
    } else if (validated.photoUrl && validated.photoUrl.startsWith('data:image')) {
      // Handle base64 images (backward compatibility)
      // Convert base64 to file and save
      try {
        const base64Data = validated.photoUrl.split(',')[1]
        const buffer = Buffer.from(base64Data, 'base64')

        // Save to temp
        const tempFileName = `temp_${Date.now()}.jpg`
        const tempDir = path.join(process.cwd(), 'storage', 'temp')
        await fs.mkdir(tempDir, { recursive: true })
        const tempPath = path.join(tempDir, tempFileName)
        await fs.writeFile(tempPath, buffer)

        finalPhotoUrl = `/api/storage/temp/${tempFileName}`
      } catch (error) {
        console.error('Failed to convert base64 to file:', error)
        finalPhotoUrl = null
      }
    }

    // Create user, student, guardians, and enrollment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate student ID
      const year = new Date().getFullYear()
      const count = await tx.student.count({ where: { tenantId } })
      const studentId = `STU-${year}-${String(count + 1).padStart(4, '0')}`

      // Create user with username and password
      const user = await tx.user.create({
        data: {
          tenantId,
          email: validated.email,
          name: validated.name,
          username: validated.username,
          password: validated.password, // TODO: Hash password before storing
          role: 'STUDENT',
        },
      })

      // Create student (with temp photo URL for now)
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
          photoUrl: finalPhotoUrl,
          presentAddress: validated.presentAddress || null,
          permanentAddress: validated.permanentAddress || null,
          rollNumber: validated.rollNumber || null,
          previousSchoolName: validated.previousSchoolName || null,
          previousSchoolAddress: validated.previousSchoolAddress || null,
          previousClass: validated.previousClass || null,
          previousBoard: validated.previousBoard || null,
          tcNumber: validated.tcNumber || null,
          previousAcademicResults: validated.previousAcademicResults && validated.previousAcademicResults.length > 0
            ? JSON.stringify(validated.previousAcademicResults)
            : null,
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

    // Move photo from temp to permanent location
    if (finalPhotoUrl && finalPhotoUrl.startsWith('/api/storage/temp/')) {
      try {
        const tempFileName = finalPhotoUrl.split('/').pop()
        if (tempFileName) {
          const tempPath = path.join(process.cwd(), 'storage', 'temp', tempFileName)

          // Create permanent directory
          const permanentDir = path.join(
            process.cwd(),
            'storage',
            'tenants',
            tenantId,
            'students',
            'photos',
            result.student.id
          )
          await fs.mkdir(permanentDir, { recursive: true })

          // Move file
          const permanentPath = path.join(permanentDir, 'profile.jpg')
          await fs.rename(tempPath, permanentPath)

          // Update student photoUrl
          const permanentUrl = `/api/storage/tenants/${tenantId}/students/photos/${result.student.id}/profile.jpg`
          await prisma.student.update({
            where: { id: result.student.id },
            data: { photoUrl: permanentUrl },
          })
        }
      } catch (error) {
        console.error('Failed to move photo to permanent location:', error)
        // Don't fail the whole admission if photo move fails
      }
    }

    revalidatePath('/students')
    revalidatePath('/students/admission')
    return { success: true, data: result }
  } catch (error) {
    console.error('Admission error:', error)
    if (error instanceof z.ZodError) {
      const firstError = error.errors?.[0]?.message || 'Validation failed'
      return { success: false, error: firstError }
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

