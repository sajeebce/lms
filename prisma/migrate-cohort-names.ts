import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper function to generate new cohort name
function generateNewCohortName(
  className: string,
  streamName: string | null,
  yearCode: string,
  branchName: string,
  isSingleBranch: boolean
): string {
  const parts: string[] = [className.toLowerCase()]
  
  if (streamName) {
    parts.push(streamName.toLowerCase())
  }
  
  const baseName = parts.join('-')
  const branchPart = isSingleBranch ? '' : ` (${branchName})`
  
  return `${baseName} ${yearCode}${branchPart}`
}

async function main() {
  console.log('🔄 Starting cohort name migration...\n')

  try {
    // Get all tenants
    const tenants = await prisma.tenant.findMany()

    for (const tenant of tenants) {
      console.log(`\n📍 Processing tenant: ${tenant.name}`)

      // Get all branches for this tenant
      const branches = await prisma.branch.findMany({
        where: { tenantId: tenant.id },
      })
      const isSingleBranch = branches.length === 1

      // Get all cohorts for this tenant
      const cohorts = await prisma.cohort.findMany({
        where: { tenantId: tenant.id },
        include: {
          year: true,
          class: true,
          stream: true,
          branch: true,
        },
      })

      console.log(`   Found ${cohorts.length} cohorts to migrate`)

      let migratedCount = 0
      let skippedCount = 0

      for (const cohort of cohorts) {
        // Check if cohort name already matches new format
        const isNewFormat = cohort.name.includes('-') && cohort.name.includes(cohort.year.code)
        
        if (isNewFormat) {
          console.log(`   ⏭️  Skipped (already new format): ${cohort.name}`)
          skippedCount++
          continue
        }

        // Generate new name
        const newName = generateNewCohortName(
          cohort.class.name,
          cohort.stream?.name || null,
          cohort.year.code,
          cohort.branch.name,
          isSingleBranch
        )

        // Check if new name already exists
        const existingWithNewName = await prisma.cohort.findFirst({
          where: {
            tenantId: tenant.id,
            yearId: cohort.yearId,
            classId: cohort.classId,
            streamId: cohort.streamId,
            branchId: cohort.branchId,
            name: newName,
          },
        })

        if (existingWithNewName && existingWithNewName.id !== cohort.id) {
          console.log(`   ⚠️  Conflict: Cannot migrate "${cohort.name}" to "${newName}" (already exists)`)
          skippedCount++
          continue
        }

        // Update cohort name
        await prisma.cohort.update({
          where: { id: cohort.id },
          data: { name: newName },
        })

        console.log(`   ✅ Migrated: "${cohort.name}" → "${newName}"`)
        migratedCount++
      }

      console.log(`\n   📊 Summary for ${tenant.name}:`)
      console.log(`      - Migrated: ${migratedCount}`)
      console.log(`      - Skipped: ${skippedCount}`)
    }

    console.log('\n✨ Migration completed successfully!\n')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

