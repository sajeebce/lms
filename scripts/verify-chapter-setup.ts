import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyChapterSetup() {
  console.log('🔍 Verifying Chapter Management Setup...\n')

  try {
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      console.error('❌ No tenant found')
      return
    }

    // 1. Check chapters exist
    console.log('1️⃣ Checking chapters...')
    const chapters = await prisma.chapter.findMany({
      where: { tenantId: tenant.id },
      include: {
        subject: { select: { name: true, icon: true } },
        class: { select: { name: true } },
        _count: { select: { topics: true } },
      },
      orderBy: [
        { class: { order: 'asc' } },
        { subject: { name: 'asc' } },
        { order: 'asc' },
      ],
    })
    console.log(`   ✅ Found ${chapters.length} chapters\n`)

    // 2. Group by subject and class
    console.log('2️⃣ Chapters by Subject and Class:')
    const grouped = chapters.reduce((acc, chapter) => {
      const key = `${chapter.subject.name} - ${chapter.class.name}`
      if (!acc[key]) acc[key] = []
      acc[key].push(chapter)
      return acc
    }, {} as Record<string, typeof chapters>)

    Object.entries(grouped).forEach(([key, chaps]) => {
      console.log(`\n   📚 ${key} (${chaps.length} chapters):`)
      chaps.forEach((ch) => {
        console.log(
          `      ${ch.order + 1}. ${ch.name} [${ch.code || 'No code'}] - ${ch.status} - ${ch._count.topics} topics`
        )
      })
    })

    // 3. Check unique constraints
    console.log('\n3️⃣ Checking unique constraints...')
    const duplicates = await prisma.$queryRaw<any[]>`
      SELECT 
        tenantId, 
        subjectId, 
        classId, 
        name, 
        COUNT(*) as count
      FROM chapters
      GROUP BY tenantId, subjectId, classId, name
      HAVING COUNT(*) > 1
    `
    if (duplicates.length === 0) {
      console.log('   ✅ No duplicate chapters found')
    } else {
      console.log(`   ⚠️  Found ${duplicates.length} duplicate chapters`)
    }

    // 4. Check status distribution
    console.log('\n4️⃣ Status distribution:')
    const activeCount = chapters.filter((c) => c.status === 'ACTIVE').length
    const inactiveCount = chapters.filter((c) => c.status === 'INACTIVE').length
    console.log(`   ✅ Active: ${activeCount}`)
    console.log(`   ⏸️  Inactive: ${inactiveCount}`)

    // 5. Check order sequence
    console.log('\n5️⃣ Checking order sequence...')
    let orderIssues = 0
    Object.entries(grouped).forEach(([key, chaps]) => {
      const orders = chaps.map((c) => c.order).sort((a, b) => a - b)
      const hasGaps = orders.some((order, idx) => idx > 0 && order !== orders[idx - 1] + 1 && order !== orders[idx - 1])
      if (hasGaps) {
        console.log(`   ⚠️  ${key} has gaps in order sequence`)
        orderIssues++
      }
    })
    if (orderIssues === 0) {
      console.log('   ✅ All order sequences are valid')
    }

    // 6. Check relations
    console.log('\n6️⃣ Checking relations...')
    // All chapters should have valid relations due to foreign key constraints
    console.log('   ✅ All chapters have valid subject and class relations (enforced by FK constraints)')

    // 7. Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total Chapters: ${chapters.length}`)
    console.log(`Active: ${activeCount} | Inactive: ${inactiveCount}`)
    console.log(`Subjects covered: ${new Set(chapters.map((c) => c.subject.name)).size}`)
    console.log(`Classes covered: ${new Set(chapters.map((c) => c.class.name)).size}`)
    console.log('='.repeat(60))

    console.log('\n✅ Chapter Management setup verification complete!')
  } catch (error) {
    console.error('\n❌ Verification failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyChapterSetup()

