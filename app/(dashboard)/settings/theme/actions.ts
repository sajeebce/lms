'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'

const themeSchema = z.object({
  themeName: z.string(),
  isCustom: z.boolean(),
  activeFrom: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  activeTo: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  hoverFrom: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  hoverTo: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  buttonFrom: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  buttonTo: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
})

export async function updateThemeSettings(data: z.infer<typeof themeSchema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = themeSchema.parse(data)
    
    await prisma.themeSettings.upsert({
      where: { tenantId },
      create: { ...validated, tenantId },
      update: validated,
    })
    
    // Revalidate layout to apply new theme
    revalidatePath('/', 'layout')
    
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to update theme settings' }
  }
}

