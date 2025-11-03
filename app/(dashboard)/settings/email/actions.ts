'use server'

import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'

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
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: 'Failed to update email carrier settings' }
  }
}

export async function updateEmailTemplates(templates: Record<string, { subject: string; body: string; enabled: boolean }>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    const emailTemplates = JSON.stringify(templates)

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: { emailTemplates },
      create: {
        tenantId,
        emailTemplates,
      },
    })

    revalidatePath('/settings/email')
    return { success: true, data: settings }
  } catch (error) {
    console.error('Error updating email templates:', error)
    return { success: false, error: 'Failed to update email templates' }
  }
}

export async function testEmailConnection(data: z.infer<typeof emailCarrierSchema>) {
  try {
    await requireRole('ADMIN')

    const validated = emailCarrierSchema.parse(data)

    if (!validated.smtpHost || !validated.smtpPort) {
      return { success: false, error: 'SMTP host and port are required' }
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: validated.smtpHost,
      port: validated.smtpPort,
      secure: validated.smtpEncryption === 'ssl', // true for 465, false for other ports
      auth: validated.smtpUser && validated.smtpPassword ? {
        user: validated.smtpUser,
        pass: validated.smtpPassword,
      } : undefined,
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    })

    // Verify connection
    await transporter.verify()

    return { success: true, message: 'Email connection test successful! SMTP server is ready.' }
  } catch (error) {
    console.error('Error testing email connection:', error)
    if (error instanceof Error) {
      return { success: false, error: `Connection failed: ${error.message}` }
    }
    return { success: false, error: 'Failed to test email connection' }
  }
}

export async function sendTestEmail(templateId: string, testEmail: string, subject: string, body: string) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()

    // Get tenant settings for SMTP config
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    })

    if (!settings?.emailEnabled) {
      return { success: false, error: 'Email is not enabled. Please enable and configure email carrier first.' }
    }

    if (!settings.smtpHost || !settings.smtpPort || !settings.smtpFromEmail) {
      return { success: false, error: 'Email carrier is not configured properly. Please configure SMTP settings first.' }
    }

    // Replace template variables with sample data
    const sampleData: Record<string, string> = {
      '[STUDENT_NAME]': 'John Doe',
      '[CLASS]': 'Class 10',
      '[SECTION]': 'Section A',
      '[ROLL_NUMBER]': '12345',
      '[ENROLLMENT_NUMBER]': 'ENR-2025-001',
      '[ADMISSION_NUMBER]': 'ADM-2025-001',
      '[LOGIN_USERNAME]': 'johndoe',
      '[LOGIN_EMAIL]': 'john.doe@example.com',
      '[LOGIN_PASSWORD]': 'SamplePass123',
      '[SCHOOL_NAME]': settings.smtpFromName || 'Your School',
    }

    let processedSubject = subject
    let processedBody = body

    Object.entries(sampleData).forEach(([variable, value]) => {
      processedSubject = processedSubject.replace(new RegExp(variable, 'g'), value)
      processedBody = processedBody.replace(new RegExp(variable, 'g'), value)
    })

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpEncryption === 'ssl', // true for 465, false for other ports
      auth: settings.smtpUser && settings.smtpPassword ? {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      } : undefined,
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    })

    // Send email
    const info = await transporter.sendMail({
      from: `"${settings.smtpFromName || 'LMS'}" <${settings.smtpFromEmail}>`,
      to: testEmail,
      subject: processedSubject,
      text: processedBody,
      html: processedBody.replace(/\n/g, '<br>'), // Simple HTML conversion
    })

    console.log('Test email sent successfully:', info.messageId)

    return { success: true, message: `Test email sent successfully to ${testEmail}! Check your inbox.` }
  } catch (error) {
    console.error('Error sending test email:', error)
    if (error instanceof Error) {
      return { success: false, error: `Failed to send email: ${error.message}` }
    }
    return { success: false, error: 'Failed to send test email' }
  }
}

