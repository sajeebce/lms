import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedTopics() {
  console.log('🌱 Seeding Topics...\n')

  try {
    // Get tenant
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      console.error('❌ No tenant found')
      return
    }

    // Get all chapters
    const chapters = await prisma.chapter.findMany({
      where: { tenantId: tenant.id },
      include: {
        subject: true,
        class: true,
      },
    })

    if (chapters.length === 0) {
      console.error('❌ No chapters found. Please run seed-chapters.ts first')
      return
    }

    console.log(`📚 Found ${chapters.length} chapters\n`)

    // Topic data for different subjects
    const topicsBySubject: Record<string, string[]> = {
      Mathematics: [
        'Introduction',
        'Basic Concepts',
        'Advanced Topics',
        'Problem Solving',
        'Applications',
      ],
      Physics: [
        'Fundamental Principles',
        'Laws and Theories',
        'Experiments',
        'Real-world Applications',
      ],
      Chemistry: [
        'Chemical Reactions',
        'Properties',
        'Laboratory Techniques',
        'Industrial Applications',
      ],
    }

    let totalCreated = 0

    // Create topics for each chapter
    for (const chapter of chapters) {
      const subjectName = chapter.subject.name
      const topicNames = topicsBySubject[subjectName] || topicsBySubject.Mathematics

      console.log(`📖 Creating topics for: ${chapter.name} (${subjectName} - ${chapter.class.name})`)

      for (let i = 0; i < topicNames.length; i++) {
        const topicName = topicNames[i]

        // Check if topic already exists
        const existing = await prisma.topic.findFirst({
          where: {
            tenantId: tenant.id,
            chapterId: chapter.id,
            name: topicName,
          },
        })

        if (existing) {
          console.log(`   ⏭️  Skipped: "${topicName}" (already exists)`)
          continue
        }

        // Create topic
        await prisma.topic.create({
          data: {
            tenantId: tenant.id,
            chapterId: chapter.id,
            name: topicName,
            code: `T${i + 1}`,
            description: `${topicName} for ${chapter.name}`,
            order: i,
            status: 'ACTIVE',
          },
        })

        console.log(`   ✅ Created: "${topicName}"`)
        totalCreated++
      }

      console.log('')
    }

    // Summary
    const totalTopics = await prisma.topic.count({
      where: { tenantId: tenant.id },
    })

    console.log(`\n📊 Summary:`)
    console.log(`   - Topics created in this run: ${totalCreated}`)
    console.log(`   - Total topics in database: ${totalTopics}`)
    console.log(`   - Chapters covered: ${chapters.length}`)

    console.log('\n✅ Topic seeding complete!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedTopics()

