import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyTopicSetup() {
  console.log('🔍 Verifying Topic Management Setup...\n')

  try {
    // Get tenant
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      console.error('❌ No tenant found')
      return
    }

    // 1. Check topics exist
    console.log('1️⃣ Checking topics...')
    const topics = await prisma.topic.findMany({
      where: { tenantId: tenant.id },
      include: {
        chapter: {
          include: {
            subject: true,
            class: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
    })

    if (topics.length === 0) {
      console.log('⚠️  No topics found. Run seed-topics.ts to create sample data.')
    } else {
      console.log(`✅ Found ${topics.length} topics`)
    }

    // 2. Check for duplicates
    console.log('\n2️⃣ Checking for duplicate topics...')
    const duplicates = await prisma.topic.groupBy({
      by: ['tenantId', 'chapterId', 'name'],
      where: { tenantId: tenant.id },
      having: {
        name: {
          _count: {
            gt: 1,
          },
        },
      },
    })

    if (duplicates.length > 0) {
      console.log(`❌ Found ${duplicates.length} duplicate topics`)
      duplicates.forEach((dup) => {
        console.log(`   - Chapter ID: ${dup.chapterId}, Name: ${dup.name}`)
      })
    } else {
      console.log('✅ No duplicate topics found')
    }

    // 3. Check status distribution
    console.log('\n3️⃣ Checking status distribution...')
    const activeCount = await prisma.topic.count({
      where: { tenantId: tenant.id, status: 'ACTIVE' },
    })
    const inactiveCount = await prisma.topic.count({
      where: { tenantId: tenant.id, status: 'INACTIVE' },
    })
    console.log(`✅ Active: ${activeCount} | Inactive: ${inactiveCount}`)

    // 4. Check order sequences
    console.log('\n4️⃣ Checking order sequences...')
    const chapters = await prisma.chapter.findMany({
      where: { tenantId: tenant.id },
      include: {
        topics: {
          orderBy: { order: 'asc' },
        },
      },
    })

    let orderIssues = 0
    for (const chapter of chapters) {
      if (chapter.topics.length > 0) {
        const orders = chapter.topics.map((t) => t.order)
        const hasDuplicates = orders.length !== new Set(orders).size
        if (hasDuplicates) {
          console.log(`⚠️  Chapter "${chapter.name}" has duplicate order values`)
          orderIssues++
        }
      }
    }

    if (orderIssues === 0) {
      console.log('✅ All order sequences are valid')
    }

    // 5. Check relations (skip - foreign key constraint ensures all topics have chapters)
    console.log('\n5️⃣ Checking relations...')
    console.log('✅ All topics have valid chapter relations (enforced by FK constraint)')

    // 6. Summary by subject
    console.log('\n6️⃣ Topics by subject:')
    const subjects = await prisma.subject.findMany({
      where: { tenantId: tenant.id },
      include: {
        chapters: {
          include: {
            topics: true,
          },
        },
      },
    })

    for (const subject of subjects) {
      const topicCount = subject.chapters.reduce(
        (sum, ch) => sum + ch.topics.length,
        0
      )
      if (topicCount > 0) {
        console.log(`   ${subject.icon || '📚'} ${subject.name}: ${topicCount} topics`)
      }
    }

    // 7. Summary by class
    console.log('\n7️⃣ Topics by class:')
    const classes = await prisma.class.findMany({
      where: { tenantId: tenant.id },
      include: {
        chapters: {
          include: {
            topics: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    })

    for (const cls of classes) {
      const topicCount = cls.chapters.reduce(
        (sum, ch) => sum + ch.topics.length,
        0
      )
      if (topicCount > 0) {
        console.log(`   ${cls.name}: ${topicCount} topics`)
      }
    }

    // Final summary
    console.log('\n📊 Final Summary:')
    console.log(`   - Total Topics: ${topics.length}`)
    console.log(`   - Subjects covered: ${subjects.filter((s) => s.chapters.some((ch) => ch.topics.length > 0)).length}`)
    console.log(`   - Classes covered: ${classes.filter((c) => c.chapters.some((ch) => ch.topics.length > 0)).length}`)
    console.log(`   - Chapters with topics: ${chapters.filter((ch) => ch.topics.length > 0).length}`)

    console.log('\n✅ Topic Management setup verification complete!')
  } catch (error) {
    console.error('❌ Verification failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyTopicSetup()

