import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding subjects...')

  const tenantId = 'tenant_1' // Default tenant from mock auth

  const subjects = [
    {
      name: 'Mathematics',
      code: 'MATH',
      icon: '📐',
      color: '#3b82f6',
      description: 'Mathematics subject covering algebra, geometry, calculus, and more',
      order: 1,
    },
    {
      name: 'Physics',
      code: 'PHY',
      icon: '⚛️',
      color: '#8b5cf6',
      description: 'Physics subject covering mechanics, thermodynamics, electromagnetism',
      order: 2,
    },
    {
      name: 'Chemistry',
      code: 'CHEM',
      icon: '🧪',
      color: '#10b981',
      description: 'Chemistry subject covering organic, inorganic, and physical chemistry',
      order: 3,
    },
    {
      name: 'Biology',
      code: 'BIO',
      icon: '🧬',
      color: '#22c55e',
      description: 'Biology subject covering botany, zoology, genetics, and ecology',
      order: 4,
    },
    {
      name: 'English',
      code: 'ENG',
      icon: '📖',
      color: '#f59e0b',
      description: 'English language and literature',
      order: 5,
    },
    {
      name: 'Bangla',
      code: 'BAN',
      icon: '📚',
      color: '#ef4444',
      description: 'Bangla language and literature',
      order: 6,
    },
    {
      name: 'Computer Science',
      code: 'CS',
      icon: '💻',
      color: '#06b6d4',
      description: 'Computer science covering programming, algorithms, data structures',
      order: 7,
    },
    {
      name: 'History',
      code: 'HIST',
      icon: '🏛️',
      color: '#a855f7',
      description: 'History of civilizations, world wars, and modern history',
      order: 8,
    },
    {
      name: 'Geography',
      code: 'GEO',
      icon: '🌍',
      color: '#14b8a6',
      description: 'Physical and human geography',
      order: 9,
    },
    {
      name: 'Economics',
      code: 'ECON',
      icon: '💰',
      color: '#f97316',
      description: 'Microeconomics, macroeconomics, and business studies',
      order: 10,
    },
  ]

  for (const subject of subjects) {
    const existing = await prisma.subject.findFirst({
      where: { tenantId, name: subject.name },
    })

    if (existing) {
      console.log(`⏭️  Subject "${subject.name}" already exists, skipping...`)
      continue
    }

    await prisma.subject.create({
      data: {
        ...subject,
        tenantId,
        status: 'ACTIVE',
      },
    })

    console.log(`✅ Created subject: ${subject.name}`)
  }

  console.log('✨ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding subjects:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

