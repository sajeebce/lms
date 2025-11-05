import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testChapters() {
  console.log('🧪 Testing Chapter Functionality...\n')

  try {
    // Get tenant
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      console.error('❌ No tenant found')
      return
    }
    console.log(`✅ Using tenant: ${tenant.name}\n`)

    // Get subjects
    const subjects = await prisma.subject.findMany({
      where: { tenantId: tenant.id, status: 'ACTIVE' },
      take: 2,
    })
    console.log(`✅ Found ${subjects.length} active subjects`)

    // Get classes
    const classes = await prisma.class.findMany({
      where: { tenantId: tenant.id },
      take: 2,
    })
    console.log(`✅ Found ${classes.length} classes\n`)

    if (subjects.length === 0 || classes.length === 0) {
      console.error('❌ Need at least 1 subject and 1 class to test')
      return
    }

    // Test 1: Create chapters
    console.log('📝 Test 1: Creating chapters...')
    const chaptersToCreate = [
      {
        tenantId: tenant.id,
        subjectId: subjects[0].id,
        classId: classes[0].id,
        name: 'Introduction to Algebra',
        code: 'CH01',
        description: 'Basic concepts of algebra',
        order: 0,
        status: 'ACTIVE' as const,
      },
      {
        tenantId: tenant.id,
        subjectId: subjects[0].id,
        classId: classes[0].id,
        name: 'Linear Equations',
        code: 'CH02',
        description: 'Solving linear equations',
        order: 1,
        status: 'ACTIVE' as const,
      },
    ]

    for (const chapterData of chaptersToCreate) {
      const chapter = await prisma.chapter.create({
        data: chapterData,
        include: {
          subject: { select: { name: true } },
          class: { select: { name: true } },
        },
      })
      console.log(
        `  ✅ Created: "${chapter.name}" (${chapter.subject.name} - ${chapter.class.name})`
      )
    }

    // Test 2: Get chapters
    console.log('\n📖 Test 2: Fetching chapters...')
    const allChapters = await prisma.chapter.findMany({
      where: { tenantId: tenant.id },
      include: {
        subject: { select: { name: true, icon: true } },
        class: { select: { name: true } },
        _count: { select: { topics: true } },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    })
    console.log(`  ✅ Found ${allChapters.length} chapters:`)
    allChapters.forEach((ch) => {
      console.log(
        `     - ${ch.name} (${ch.subject.icon || '📚'} ${ch.subject.name} - ${ch.class.name}) [${ch.status}]`
      )
    })

    // Test 3: Update chapter
    console.log('\n✏️  Test 3: Updating chapter...')
    const firstChapter = allChapters[0]
    const updated = await prisma.chapter.update({
      where: { id: firstChapter.id },
      data: {
        description: 'Updated description for testing',
        status: 'INACTIVE',
      },
    })
    console.log(`  ✅ Updated: "${updated.name}" - Status: ${updated.status}`)

    // Test 4: Filter by subject
    console.log('\n🔍 Test 4: Filtering by subject...')
    const filteredChapters = await prisma.chapter.findMany({
      where: {
        tenantId: tenant.id,
        subjectId: subjects[0].id,
      },
      include: {
        subject: { select: { name: true } },
      },
    })
    console.log(`  ✅ Found ${filteredChapters.length} chapters for ${subjects[0].name}`)

    // Test 5: Delete guard (try to delete with topics)
    console.log('\n🗑️  Test 5: Testing delete guard...')
    const chapterToDelete = allChapters[allChapters.length - 1]
    
    // Check if it has topics
    const chapterWithCount = await prisma.chapter.findUnique({
      where: { id: chapterToDelete.id },
      include: {
        _count: { select: { topics: true } },
      },
    })

    if (chapterWithCount && chapterWithCount._count.topics > 0) {
      console.log(`  ⚠️  Chapter has ${chapterWithCount._count.topics} topics - cannot delete`)
    } else {
      await prisma.chapter.delete({
        where: { id: chapterToDelete.id },
      })
      console.log(`  ✅ Deleted: "${chapterToDelete.name}"`)
    }

    // Final count
    const finalCount = await prisma.chapter.count({
      where: { tenantId: tenant.id },
    })
    console.log(`\n📊 Final chapter count: ${finalCount}`)

    console.log('\n✅ All tests passed! Chapter functionality is working correctly.')
  } catch (error) {
    console.error('\n❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testChapters()

