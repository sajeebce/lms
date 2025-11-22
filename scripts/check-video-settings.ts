import { prisma } from '../lib/prisma'

async function main() {
  try {
    // Try to get tenant settings
    const settings = await prisma.tenantSettings.findFirst({
      where: { tenantId: 'tenant_1' },
    })

    console.log('Current tenant settings:', JSON.stringify(settings, null, 2))

    // Try to update with videoSettings
    const updated = await prisma.tenantSettings.upsert({
      where: { tenantId: 'tenant_1' },
      update: {
        videoSettings: JSON.stringify({
          youtube: {
            pauseOverlay: {
              topLabel: 'Test',
              titleText: 'Test',
              bottomLeftText: 'Test',
              bottomRightText: 'Test',
              topBackgroundClass: 'test',
              bottomBackgroundClass: 'test',
            },
          },
          vdocipher: {
            enabled: false,
            apiKey: '',
            secretKey: '',
          },
        }),
      },
      create: {
        tenantId: 'tenant_1',
        videoSettings: JSON.stringify({
          youtube: {
            pauseOverlay: {
              topLabel: 'Test',
              titleText: 'Test',
              bottomLeftText: 'Test',
              bottomRightText: 'Test',
              topBackgroundClass: 'test',
              bottomBackgroundClass: 'test',
            },
          },
          vdocipher: {
            enabled: false,
            apiKey: '',
            secretKey: '',
          },
        }),
      },
    })

    console.log('Updated settings:', JSON.stringify(updated, null, 2))
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

