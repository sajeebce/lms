'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'

const wizardSchema = z.object({
  yearId: z.string().min(1, 'Academic year is required'),
  branchId: z.string().min(1, 'Branch is required'),
  classIds: z.array(z.string()).min(1, 'At least one class is required'),
})

type PreviewItem = {
  classId: string
  className: string
  cohortName: string
  sections: { name: string; capacity: number }[]
  exists: boolean
}

export async function previewYearWizard(data: z.infer<typeof wizardSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = wizardSchema.parse(data)

    const [year, branch, classes, templates] = await Promise.all([
      prisma.academicYear.findUnique({
        where: { id: validated.yearId, tenantId },
      }),
      prisma.branch.findUnique({
        where: { id: validated.branchId, tenantId },
      }),
      prisma.class.findMany({
        where: { id: { in: validated.classIds }, tenantId },
      }),
      prisma.sectionTemplate.findMany({
        where: {
          classId: { in: validated.classIds },
          tenantId,
        },
        include: { class: true },
      }),
    ])

    if (!year || !branch) {
      return { success: false, error: 'Invalid year or branch' }
    }

    const preview: PreviewItem[] = []

    for (const cls of classes) {
      const cohortName = `${cls.name} – ${year.name.split('–')[0].trim()} Intake`

      // Check if cohort exists
      const existingCohort = await prisma.cohort.findFirst({
        where: {
          tenantId,
          yearId: validated.yearId,
          classId: cls.id,
          branchId: validated.branchId,
          name: cohortName,
        },
      })

      // Get templates for this class
      const classTemplates = templates.filter((t) => t.classId === cls.id)

      preview.push({
        classId: cls.id,
        className: cls.name,
        cohortName,
        sections: classTemplates.map((t) => ({
          name: t.name,
          capacity: t.capacity,
        })),
        exists: !!existingCohort,
      })
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

    const [year, branch, classes, templates] = await Promise.all([
      prisma.academicYear.findUnique({
        where: { id: validated.yearId, tenantId },
      }),
      prisma.branch.findUnique({
        where: { id: validated.branchId, tenantId },
      }),
      prisma.class.findMany({
        where: { id: { in: validated.classIds }, tenantId },
      }),
      prisma.sectionTemplate.findMany({
        where: {
          classId: { in: validated.classIds },
          tenantId,
        },
      }),
    ])

    if (!year || !branch) {
      return { success: false, error: 'Invalid year or branch' }
    }

    let cohortsCreated = 0
    let sectionsCreated = 0
    let skipped = 0

    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      for (const cls of classes) {
        const cohortName = `${cls.name} – ${year.name.split('–')[0].trim()} Intake`

        // Check if cohort exists
        const existingCohort = await tx.cohort.findFirst({
          where: {
            tenantId,
            yearId: validated.yearId,
            classId: cls.id,
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
            branchId: validated.branchId,
            name: cohortName,
            status: 'PLANNED',
            enrollmentOpen: false,
          },
        })

        cohortsCreated++

        // Create sections from templates
        const classTemplates = templates.filter((t) => t.classId === cls.id)

        for (const template of classTemplates) {
          await tx.section.create({
            data: {
              tenantId,
              cohortId: cohort.id,
              name: template.name,
              capacity: template.capacity,
              note: template.note,
            },
          })
          sectionsCreated++
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

