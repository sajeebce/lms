import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedChapters() {
  console.log('🌱 Seeding Chapters...\n')

  try {
    // Get tenant
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      console.error('❌ No tenant found')
      return
    }

    // Get subjects
    const mathematics = await prisma.subject.findFirst({
      where: { tenantId: tenant.id, name: 'Mathematics' },
    })
    const physics = await prisma.subject.findFirst({
      where: { tenantId: tenant.id, name: 'Physics' },
    })
    const chemistry = await prisma.subject.findFirst({
      where: { tenantId: tenant.id, name: 'Chemistry' },
    })

    // Get classes
    const class9 = await prisma.class.findFirst({
      where: { tenantId: tenant.id, name: 'Nine' },
    })
    const class10 = await prisma.class.findFirst({
      where: { tenantId: tenant.id, name: 'Ten' },
    })

    if (!mathematics || !physics || !chemistry || !class9 || !class10) {
      console.error('❌ Required subjects or classes not found')
      return
    }

    // Mathematics Chapters for Class 9
    const mathChapters9 = [
      { name: 'Number Systems', code: 'M9-CH01', description: 'Real numbers and their properties', order: 0 },
      { name: 'Polynomials', code: 'M9-CH02', description: 'Introduction to polynomials', order: 1 },
      { name: 'Linear Equations', code: 'M9-CH03', description: 'Equations in two variables', order: 2 },
      { name: 'Coordinate Geometry', code: 'M9-CH04', description: 'Cartesian plane and coordinates', order: 3 },
    ]

    // Mathematics Chapters for Class 10
    const mathChapters10 = [
      { name: 'Real Numbers', code: 'M10-CH01', description: 'Euclid\'s division algorithm', order: 0 },
      { name: 'Polynomials', code: 'M10-CH02', description: 'Zeros of polynomials', order: 1 },
      { name: 'Pair of Linear Equations', code: 'M10-CH03', description: 'Solving linear equations', order: 2 },
      { name: 'Quadratic Equations', code: 'M10-CH04', description: 'Solving quadratic equations', order: 3 },
    ]

    // Physics Chapters for Class 9
    const physicsChapters9 = [
      { name: 'Motion', code: 'P9-CH01', description: 'Describing motion', order: 0 },
      { name: 'Force and Laws of Motion', code: 'P9-CH02', description: 'Newton\'s laws', order: 1 },
      { name: 'Gravitation', code: 'P9-CH03', description: 'Universal law of gravitation', order: 2 },
    ]

    // Physics Chapters for Class 10
    const physicsChapters10 = [
      { name: 'Light - Reflection and Refraction', code: 'P10-CH01', description: 'Properties of light', order: 0 },
      { name: 'Human Eye', code: 'P10-CH02', description: 'Structure and function', order: 1 },
      { name: 'Electricity', code: 'P10-CH03', description: 'Electric current and circuits', order: 2 },
    ]

    // Chemistry Chapters for Class 9
    const chemistryChapters9 = [
      { name: 'Matter in Our Surroundings', code: 'C9-CH01', description: 'States of matter', order: 0 },
      { name: 'Atoms and Molecules', code: 'C9-CH02', description: 'Basic concepts', order: 1 },
      { name: 'Structure of Atom', code: 'C9-CH03', description: 'Atomic structure', order: 2 },
    ]

    // Chemistry Chapters for Class 10
    const chemistryChapters10 = [
      { name: 'Chemical Reactions', code: 'C10-CH01', description: 'Types of reactions', order: 0 },
      { name: 'Acids, Bases and Salts', code: 'C10-CH02', description: 'Properties and uses', order: 1 },
      { name: 'Metals and Non-metals', code: 'C10-CH03', description: 'Physical and chemical properties', order: 2 },
    ]

    let created = 0

    // Create Mathematics chapters
    for (const chapter of mathChapters9) {
      await prisma.chapter.upsert({
        where: {
          tenantId_subjectId_classId_name: {
            tenantId: tenant.id,
            subjectId: mathematics.id,
            classId: class9.id,
            name: chapter.name,
          },
        },
        update: {},
        create: {
          ...chapter,
          tenantId: tenant.id,
          subjectId: mathematics.id,
          classId: class9.id,
          status: 'ACTIVE',
        },
      })
      created++
    }

    for (const chapter of mathChapters10) {
      await prisma.chapter.upsert({
        where: {
          tenantId_subjectId_classId_name: {
            tenantId: tenant.id,
            subjectId: mathematics.id,
            classId: class10.id,
            name: chapter.name,
          },
        },
        update: {},
        create: {
          ...chapter,
          tenantId: tenant.id,
          subjectId: mathematics.id,
          classId: class10.id,
          status: 'ACTIVE',
        },
      })
      created++
    }

    // Create Physics chapters
    for (const chapter of physicsChapters9) {
      await prisma.chapter.upsert({
        where: {
          tenantId_subjectId_classId_name: {
            tenantId: tenant.id,
            subjectId: physics.id,
            classId: class9.id,
            name: chapter.name,
          },
        },
        update: {},
        create: {
          ...chapter,
          tenantId: tenant.id,
          subjectId: physics.id,
          classId: class9.id,
          status: 'ACTIVE',
        },
      })
      created++
    }

    for (const chapter of physicsChapters10) {
      await prisma.chapter.upsert({
        where: {
          tenantId_subjectId_classId_name: {
            tenantId: tenant.id,
            subjectId: physics.id,
            classId: class10.id,
            name: chapter.name,
          },
        },
        update: {},
        create: {
          ...chapter,
          tenantId: tenant.id,
          subjectId: physics.id,
          classId: class10.id,
          status: 'ACTIVE',
        },
      })
      created++
    }

    // Create Chemistry chapters
    for (const chapter of chemistryChapters9) {
      await prisma.chapter.upsert({
        where: {
          tenantId_subjectId_classId_name: {
            tenantId: tenant.id,
            subjectId: chemistry.id,
            classId: class9.id,
            name: chapter.name,
          },
        },
        update: {},
        create: {
          ...chapter,
          tenantId: tenant.id,
          subjectId: chemistry.id,
          classId: class9.id,
          status: 'ACTIVE',
        },
      })
      created++
    }

    for (const chapter of chemistryChapters10) {
      await prisma.chapter.upsert({
        where: {
          tenantId_subjectId_classId_name: {
            tenantId: tenant.id,
            subjectId: chemistry.id,
            classId: class10.id,
            name: chapter.name,
          },
        },
        update: {},
        create: {
          ...chapter,
          tenantId: tenant.id,
          subjectId: chemistry.id,
          classId: class10.id,
          status: 'ACTIVE',
        },
      })
      created++
    }

    console.log(`✅ Created/Updated ${created} chapters`)

    // Show summary
    const totalChapters = await prisma.chapter.count({
      where: { tenantId: tenant.id },
    })
    console.log(`\n📊 Total chapters in database: ${totalChapters}`)

    const bySubject = await prisma.chapter.groupBy({
      by: ['subjectId'],
      where: { tenantId: tenant.id },
      _count: true,
    })

    console.log('\n📚 Chapters by subject:')
    for (const group of bySubject) {
      const subject = await prisma.subject.findUnique({
        where: { id: group.subjectId },
      })
      console.log(`  - ${subject?.name}: ${group._count} chapters`)
    }

    console.log('\n✅ Chapter seeding complete!')
  } catch (error) {
    console.error('\n❌ Seeding failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedChapters()

