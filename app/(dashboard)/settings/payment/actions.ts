'use server'

import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const paymentMethodsSchema = z.object({
  paymentMethods: z.string().optional().nullable(),
})

export async function updatePaymentMethods(data: z.infer<typeof paymentMethodsSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    const validated = paymentMethodsSchema.parse(data)

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: validated,
      create: {
        tenantId,
        ...validated,
      },
    })

    revalidatePath('/settings/payment')
    return { success: true, data: settings }
  } catch (error) {
    console.error('Error updating payment methods:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to update payment methods' }
  }
}

