import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-school' },
    update: {},
    create: {
      id: 'tenant_1',
      name: 'Demo School',
      slug: 'demo-school',
    },
  })

  // Create admin user
  await prisma.user.upsert({
    where: { id: 'user_1' },
    update: {},
    create: {
      id: 'user_1',
      tenantId: tenant.id,
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
  })

  // Create default theme settings
  await prisma.themeSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      mode: 'light',
      themeName: 'pink-orange',
      isCustom: false,
      activeFrom: '#ec4899',
      activeTo: '#f97316',
      hoverFrom: '#fdf2f8',
      hoverTo: '#fff7ed',
      borderColor: '#fbcfe8',
      buttonFrom: '#ec4899',
      buttonTo: '#f97316',
    },
  })

  // Create sample teachers
  const teachers = [
    { name: 'Dr. Sarah Ahmed', email: 'sarah@example.com', phone: '01711111111' },
    { name: 'Prof. Karim Rahman', email: 'karim@example.com', phone: '01722222222' },
    { name: 'Ms. Fatima Khan', email: 'fatima@example.com', phone: '01733333333' },
    { name: 'Mr. Rahim Hossain', email: 'rahim@example.com', phone: '01744444444' },
  ]

  for (const teacher of teachers) {
    await prisma.teacher.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: teacher.email } },
      update: {},
      create: {
        tenantId: tenant.id,
        ...teacher,
      },
    })
  }

  // Create sample rooms
  const rooms = [
    { name: 'Room 101', capacity: 40, status: 'ACTIVE' as const },
    { name: 'Room 102', capacity: 40, status: 'ACTIVE' as const },
    { name: 'Room 201', capacity: 50, status: 'ACTIVE' as const },
    { name: 'Room 202', capacity: 50, status: 'ACTIVE' as const },
    { name: 'Lab A', capacity: 30, status: 'ACTIVE' as const },
    { name: 'Lab B', capacity: 30, status: 'ACTIVE' as const },
  ]

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: room.name } },
      update: {},
      create: {
        tenantId: tenant.id,
        ...room,
      },
    })
  }

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

