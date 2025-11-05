'use server'

import { requireRole, getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get Classes
export async function getClasses() {
  // 1. ROLE GUARD
  await requireRole(['ADMIN', 'TEACHER'])

  // 2. TENANT ID
  const tenantId = await getTenantId()

  // 4. TENANT ISOLATION
  const classes = await prisma.class.findMany({
    where: { tenantId },
    include: {
      stream: true,
      _count: {
        select: { cohorts: true, courses: true },
      },
    },
    orderBy: { order: 'asc' },
  })

  return classes
}

// Get Class by ID
export async function getClassById(id: string) {
  // 1. ROLE GUARD
  await requireRole(['ADMIN', 'TEACHER'])

  // 2. TENANT ID
  const tenantId = await getTenantId()

  // 4. OWNERSHIP CHECK + TENANT ISOLATION
  const classData = await prisma.class.findFirst({
    where: { id, tenantId },
    include: {
      stream: true,
      _count: {
        select: { cohorts: true, courses: true },
      },
    },
  })

  return classData
}

