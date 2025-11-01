'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'

const wizardSchema = z.object({
  yearId: z.string().min(1, 'Academic year is required'),
  branchId: z.string().min(1, 'Branch is required'),
  classIds: z.array(z.string()).min(1, 'At least one class is required'),
  streamIds: z.array(z.string()).optional().default([]),
  sectionNames: z.array(z.string()).optional().default([]),
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED']),
  enrollmentOpen: z.boolean(),
})

type PreviewItem = {
  classId: string
  className: string
  cohortName: string
  sections: { name: string; capacity: number }[]
  exists: boolean
}

// Helper function to generate cohort name
function generateCohortName(
  className: string,
  streamName: string | undefined,
  sectionName: string | undefined,
  yearCode: string,
  branchName: string,
  isSingleBranch: boolean
): string {
  const parts: string[] = [className.toLowerCase()]

  if (streamName) {
    parts.push(streamName.toLowerCase())
  }

  if (sectionName) {
    parts.push(sectionName.toLowerCase())
  }

  const baseName = parts.join('-')
  const yearPart = yearCode
  const branchPart = isSingleBranch ? '' : ` (${branchName})`

  return `${baseName} ${yearPart}${branchPart}`
}

export async function previewYearWizard(data: z.infer<typeof wizardSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = wizardSchema.parse(data)

    const [year, branch, classes, streams] = await Promise.all([
      prisma.academicYear.findUnique({
        where: { id: validated.yearId, tenantId },
      }),
      prisma.branch.findUnique({
        where: { id: validated.branchId, tenantId },
      }),
      prisma.class.findMany({
        where: { id: { in: validated.classIds }, tenantId },
      }),
      validated.streamIds.length > 0
        ? prisma.stream.findMany({
            where: { id: { in: validated.streamIds }, tenantId },
          })
        : Promise.resolve([]),
    ])

    if (!year || !branch) {
      return { success: false, error: 'Invalid year or branch' }
    }

    // Get all branches to check if this is single branch
    const allBranches = await prisma.branch.findMany({
      where: { tenantId },
    })
    const isSingleBranch = allBranches.length === 1

    const preview: PreviewItem[] = []
    const yearCode = year.code

    // Generate combinations
    for (const cls of classes) {
      const streamsToUse = validated.streamIds.length > 0
        ? streams
        : [{ id: '', name: '' }]

      const sectionsToUse = validated.sectionNames.length > 0
        ? validated.sectionNames
        : ['']

      for (const stream of streamsToUse) {
        for (const sectionName of sectionsToUse) {
          const cohortName = generateCohortName(
            cls.name,
            stream.name || undefined,
            sectionName || undefined,
            yearCode,
            branch.name,
            isSingleBranch
          )

          // Check if cohort exists
          const existingCohort = await prisma.cohort.findFirst({
            where: {
              tenantId,
              yearId: validated.yearId,
              classId: cls.id,
              streamId: stream.id || undefined,
              branchId: validated.branchId,
              name: cohortName,
            },
          })

          preview.push({
            classId: cls.id,
            className: cls.name,
            cohortName,
            sections: sectionName ? [{ name: sectionName, capacity: 0 }] : [],
            exists: !!existingCohort,
          })
        }
      }
    }

    return { success: true, preview, year: year.name, branch: branch.name }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to generate preview' }
  }
}

export async function executeYearWizard(data: z.infer<typeof wizardSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = wizardSchema.parse(data)

    const [year, branch, classes, streams, allBranches] = await Promise.all([
      prisma.academicYear.findUnique({
        where: { id: validated.yearId, tenantId },
      }),
      prisma.branch.findUnique({
        where: { id: validated.branchId, tenantId },
      }),
      prisma.class.findMany({
        where: { id: { in: validated.classIds }, tenantId },
      }),
      validated.streamIds.length > 0
        ? prisma.stream.findMany({
            where: { id: { in: validated.streamIds }, tenantId },
          })
        : Promise.resolve([]),
      prisma.branch.findMany({
        where: { tenantId },
      }),
    ])

    if (!year || !branch) {
      return { success: false, error: 'Invalid year or branch' }
    }

    const isSingleBranch = allBranches.length === 1
    const yearCode = year.code

    let cohortsCreated = 0
    let sectionsCreated = 0
    let skipped = 0

    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      for (const cls of classes) {
        const streamsToUse = validated.streamIds.length > 0
          ? streams
          : [{ id: '', name: '' }]

        const sectionsToUse = validated.sectionNames.length > 0
          ? validated.sectionNames
          : ['']

        for (const stream of streamsToUse) {
          for (const sectionName of sectionsToUse) {
            const cohortName = generateCohortName(
              cls.name,
              stream.name || undefined,
              sectionName || undefined,
              yearCode,
              branch.name,
              isSingleBranch
            )

            // Check if cohort exists
            const existingCohort = await tx.cohort.findFirst({
              where: {
                tenantId,
                yearId: validated.yearId,
                classId: cls.id,
                streamId: stream.id || undefined,
                branchId: validated.branchId,
                name: cohortName,
              },
            })

            if (existingCohort) {
              skipped++
              continue
            }

            // Create cohort
            const cohort = await tx.cohort.create({
              data: {
                tenantId,
                yearId: validated.yearId,
                classId: cls.id,
                streamId: stream.id || undefined,
                branchId: validated.branchId,
                name: cohortName,
                status: validated.status,
                enrollmentOpen: validated.enrollmentOpen,
              },
            })

            cohortsCreated++

            // Link section to cohort if section name provided
            if (sectionName) {
              // Check if section already exists
              let section = await tx.section.findFirst({
                where: {
                  tenantId,
                  name: sectionName,
                },
              })

              // If section doesn't exist, create it
              if (!section) {
                section = await tx.section.create({
                  data: {
                    tenantId,
                    name: sectionName,
                    capacity: 0, // Default unlimited
                  },
                })
                sectionsCreated++
              }

              // Link section to cohort via junction table
              await tx.cohortSection.create({
                data: {
                  tenantId,
                  cohortId: cohort.id,
                  sectionId: section.id,
                },
              })
            }
          }
        }
      }
    })

    revalidatePath('/academic-setup/cohorts')
    revalidatePath('/academic-setup/sections')
    revalidatePath('/academic-setup/year-wizard')

    return {
      success: true,
      stats: { cohortsCreated, sectionsCreated, skipped },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to execute wizard' }
  }
}

