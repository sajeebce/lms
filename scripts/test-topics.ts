import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testTopics() {
  console.log('🧪 Testing Topic Management...\n')

  try {
    // Get tenant
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      console.error('❌ No tenant found')
      return
    }

    // Get a chapter
    const chapter = await prisma.chapter.findFirst({
      where: { tenantId: tenant.id },
      include: {
        subject: true,
        class: true,
      },
    })

    if (!chapter) {
      console.error('❌ No chapter found. Please run seed-chapters.ts first')
      return
    }

    console.log(`📚 Using Chapter: ${chapter.name} (${chapter.subject.name} - ${chapter.class.name})`)

    // Test 1: Create topics
    console.log('\n1️⃣ Creating topics...')
    const topic1 = await prisma.topic.create({
      data: {
        tenantId: tenant.id,
        chapterId: chapter.id,
        name: 'Introduction to Algebra',
        code: 'T1',
        description: 'Basic concepts of algebra',
        order: 0,
        status: 'ACTIVE',
      },
    })
    console.log(`✅ Created: "${topic1.name}"`)

    const topic2 = await prisma.topic.create({
      data: {
        tenantId: tenant.id,
        chapterId: chapter.id,
        name: 'Algebraic Expressions',
        code: 'T2',
        description: 'Working with algebraic expressions',
        order: 1,
        status: 'ACTIVE',
      },
    })
    console.log(`✅ Created: "${topic2.name}"`)

    // Test 2: Get all topics
    console.log('\n2️⃣ Fetching all topics...')
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
    console.log(`✅ Found ${topics.length} topics`)

    // Test 3: Update topic
    console.log('\n3️⃣ Updating topic...')
    const updatedTopic = await prisma.topic.update({
      where: { id: topic1.id },
      data: {
        status: 'INACTIVE',
      },
    })
    console.log(`✅ Updated: "${updatedTopic.name}" - Status: ${updatedTopic.status}`)

    // Test 4: Filter topics by chapter
    console.log('\n4️⃣ Filtering topics by chapter...')
    const chapterTopics = await prisma.topic.findMany({
      where: {
        tenantId: tenant.id,
        chapterId: chapter.id,
      },
    })
    console.log(`✅ Found ${chapterTopics.length} topics for chapter "${chapter.name}"`)

    // Test 5: Delete topic
    console.log('\n5️⃣ Deleting topic...')
    await prisma.topic.delete({
      where: { id: topic2.id },
    })
    console.log(`✅ Deleted: "${topic2.name}"`)

    // Final count
    const finalCount = await prisma.topic.count({
      where: { tenantId: tenant.id },
    })
    console.log(`\n📊 Final topic count: ${finalCount}`)

    console.log('\n✅ All tests passed! Topic functionality is working correctly.')
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testTopics()

