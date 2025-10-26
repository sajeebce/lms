'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'

const branchSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

export async function createBranch(data: z.infer<typeof branchSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = branchSchema.parse(data)

    await prisma.branch.create({
      data: {
        ...validated,
        tenantId,
      },
    })

    revalidatePath('/academic-setup/branches')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to create branch' }
  }
}

export async function updateBranch(
  id: string,
  data: z.infer<typeof branchSchema>
) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = branchSchema.parse(data)

    await prisma.branch.update({
      where: { id, tenantId },
      data: validated,
    })

    revalidatePath('/academic-setup/branches')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to update branch' }
  }
}

export async function deleteBranch(id: string) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Check if branch has cohorts
    const cohortCount = await prisma.cohort.count({
      where: { branchId: id, tenantId },
    })

    if (cohortCount > 0) {
      return {
        success: false,
        error: 'Cannot delete: Branch has linked Cohorts',
      }
    }

    await prisma.branch.delete({
      where: { id, tenantId },
    })

    revalidatePath('/academic-setup/branches')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to delete branch' }
  }
}

