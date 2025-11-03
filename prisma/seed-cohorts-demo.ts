import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting cohort demo seed...')

  // Get tenant (assuming first tenant)
  const tenant = await prisma.tenant.findFirst()
  if (!tenant) {
    throw new Error('No tenant found. Please run main seed first.')
  }

  console.log(`✅ Using tenant: ${tenant.name}`)

  // Get or create Academic Year 2024-2025
  let academicYear = await prisma.academicYear.findFirst({
    where: {
      tenantId: tenant.id,
      code: '2024-2025',
    },
  })

  if (!academicYear) {
    academicYear = await prisma.academicYear.create({
      data: {
        tenantId: tenant.id,
        name: '2024-2025',
        code: '2024-2025',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        state: 'ACTIVE',
        isCurrent: true,
      },
    })
    console.log('✅ Created Academic Year: 2024-2025')
  } else {
    console.log('✅ Found Academic Year: 2024-2025')
  }

  // Get or create Branch
  let branch = await prisma.branch.findFirst({
    where: {
      tenantId: tenant.id,
      name: 'Main Campus',
    },
  })

  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Campus',
        code: 'MAIN',
        status: 'ACTIVE',
      },
    })
    console.log('✅ Created Branch: Main Campus')
  } else {
    console.log('✅ Found Branch: Main Campus')
  }

  // Get or create Streams
  const streamNames = ['Science', 'Commerce', 'Arts']
  const streams: any[] = []

  for (const streamName of streamNames) {
    let stream = await prisma.stream.findFirst({
      where: {
        tenantId: tenant.id,
        name: streamName,
      },
    })

    if (!stream) {
      stream = await prisma.stream.create({
        data: {
          tenantId: tenant.id,
          name: streamName,
        },
      })
      console.log(`✅ Created Stream: ${streamName}`)
    } else {
      console.log(`✅ Found Stream: ${streamName}`)
    }

    streams.push(stream)
  }

  // Get or create Class 9
  let class9 = await prisma.class.findFirst({
    where: {
      tenantId: tenant.id,
      name: 'Class 9',
    },
  })

  if (!class9) {
    class9 = await prisma.class.create({
      data: {
        tenantId: tenant.id,
        name: 'Class 9',
        alias: '9',
        order: 9,
      },
    })
    console.log('✅ Created Class: Class 9')
  } else {
    console.log('✅ Found Class: Class 9')
  }

  // Get or create Class 8 (for promotion scenario)
  let class8 = await prisma.class.findFirst({
    where: {
      tenantId: tenant.id,
      name: 'Class 8',
    },
  })

  if (!class8) {
    class8 = await prisma.class.create({
      data: {
        tenantId: tenant.id,
        name: 'Class 8',
        alias: '8',
        order: 8,
      },
    })
    console.log('✅ Created Class: Class 8')
  } else {
    console.log('✅ Found Class: Class 8')
  }

  console.log('\n📚 Creating Cohorts...\n')

  // January 2024 Intake - Direct Admission (First batch)
  const januaryIntake = [
    { stream: streams[0], name: 'January 2024 - Boys', gender: 'Boys' },
    { stream: streams[0], name: 'January 2024 - Girls', gender: 'Girls' },
    { stream: streams[1], name: 'January 2024 - Boys', gender: 'Boys' },
    { stream: streams[1], name: 'January 2024 - Girls', gender: 'Girls' },
    { stream: streams[2], name: 'January 2024 - Boys', gender: 'Boys' },
    { stream: streams[2], name: 'January 2024 - Girls', gender: 'Girls' },
  ]

  for (const cohortData of januaryIntake) {
    const existing = await prisma.cohort.findFirst({
      where: {
        tenantId: tenant.id,
        yearId: academicYear.id,
        classId: class9.id,
        streamId: cohortData.stream.id,
        branchId: branch.id,
        name: cohortData.name,
      },
    })

    if (!existing) {
      await prisma.cohort.create({
        data: {
          tenantId: tenant.id,
          yearId: academicYear.id,
          classId: class9.id,
          streamId: cohortData.stream.id,
          branchId: branch.id,
          name: cohortData.name,
          status: 'ACTIVE',
          enrollmentOpen: false,
          startDate: new Date('2024-01-01'),
        },
      })
      console.log(`✅ Created: Class 9 ${cohortData.stream.name} - ${cohortData.name}`)
    } else {
      console.log(`⏭️  Skipped (exists): Class 9 ${cohortData.stream.name} - ${cohortData.name}`)
    }
  }

  console.log('\n🔄 Creating June 2024 Intake (Promoted from Class 8)...\n')

  // June 2024 Intake - Promoted from Class 8 (Second batch - overlapping)
  const juneIntake = [
    { stream: streams[0], name: 'June 2024 - Boys (Promoted)', gender: 'Boys' },
    { stream: streams[0], name: 'June 2024 - Girls (Promoted)', gender: 'Girls' },
    { stream: streams[1], name: 'June 2024 - Boys (Promoted)', gender: 'Boys' },
    { stream: streams[1], name: 'June 2024 - Girls (Promoted)', gender: 'Girls' },
    { stream: streams[2], name: 'June 2024 - Boys (Promoted)', gender: 'Boys' },
    { stream: streams[2], name: 'June 2024 - Girls (Promoted)', gender: 'Girls' },
  ]

  for (const cohortData of juneIntake) {
    const existing = await prisma.cohort.findFirst({
      where: {
        tenantId: tenant.id,
        yearId: academicYear.id,
        classId: class9.id,
        streamId: cohortData.stream.id,
        branchId: branch.id,
        name: cohortData.name,
      },
    })

    if (!existing) {
      await prisma.cohort.create({
        data: {
          tenantId: tenant.id,
          yearId: academicYear.id,
          classId: class9.id,
          streamId: cohortData.stream.id,
          branchId: branch.id,
          name: cohortData.name,
          status: 'ACTIVE',
          enrollmentOpen: true,
          startDate: new Date('2024-06-01'),
        },
      })
      console.log(`✅ Created: Class 9 ${cohortData.stream.name} - ${cohortData.name}`)
    } else {
      console.log(`⏭️  Skipped (exists): Class 9 ${cohortData.stream.name} - ${cohortData.name}`)
    }
  }

  console.log('\n✨ Cohort demo seed completed!\n')
  console.log('📊 Summary:')
  console.log('  - Academic Year: 2024-2025 (IN_SESSION)')
  console.log('  - Class: 9')
  console.log('  - Streams: Science, Commerce, Arts')
  console.log('  - January 2024 Intake: 6 cohorts (Boys + Girls for each stream)')
  console.log('  - June 2024 Intake: 6 cohorts (Promoted from Class 8)')
  console.log('  - Total: 12 cohorts running simultaneously in same academic year!')
  console.log('\n🎯 This demonstrates:')
  console.log('  ✅ Multiple intakes in same year')
  console.log('  ✅ Stream-based separation (Science/Commerce/Arts)')
  console.log('  ✅ Gender-based batches (Boys/Girls)')
  console.log('  ✅ Overlapping sessions (January batch still running when June batch starts)')
  console.log('  ✅ No conflicts due to unique constraint: [year, class, stream, branch, name]')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

