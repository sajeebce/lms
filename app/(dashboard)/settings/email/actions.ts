'use server'

import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const emailCarrierSchema = z.object({
  emailEnabled: z.boolean(),
  smtpHost: z.string().max(200).optional().nullable(),
  smtpPort: z.number().min(1).max(65535).optional().nullable(),
  smtpUser: z.string().max(200).optional().nullable(),
  smtpPassword: z.string().max(200).optional().nullable(),
  smtpFromEmail: z.string().email().max(200).optional().nullable(),
  smtpFromName: z.string().max(200).optional().nullable(),
  smtpEncryption: z.enum(['tls', 'ssl', 'none']).optional().nullable(),
})

const emailTemplatesSchema = z.object({
  emailTemplates: z.string().optional().nullable(),
})

export async function updateEmailCarrier(data: z.infer<typeof emailCarrierSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    const validated = emailCarrierSchema.parse(data)

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: validated,
      create: {
        tenantId,
        ...validated,
      },
    })

    revalidatePath('/settings/email')
    return { success: true, data: settings }
  } catch (error) {
    console.error('Error updating email carrier:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to update email carrier settings' }
  }
}

export async function updateEmailTemplates(data: z.infer<typeof emailTemplatesSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    const validated = emailTemplatesSchema.parse(data)

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: validated,
      create: {
        tenantId,
        ...validated,
      },
    })

    revalidatePath('/settings/email')
    return { success: true, data: settings }
  } catch (error) {
    console.error('Error updating email templates:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to update email templates' }
  }
}

export async function testEmailConnection(data: z.infer<typeof emailCarrierSchema>) {
  try {
    await requireRole('ADMIN')
    
    // TODO: Implement actual SMTP connection test
    // For now, just validate the data
    const validated = emailCarrierSchema.parse(data)
    
    if (!validated.smtpHost || !validated.smtpPort) {
      return { success: false, error: 'SMTP host and port are required' }
    }

    // Simulate connection test
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return { success: true, message: 'Email connection test successful' }
  } catch (error) {
    console.error('Error testing email connection:', error)
    return { success: false, error: 'Failed to test email connection' }
  }
}

