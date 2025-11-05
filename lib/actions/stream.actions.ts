'use server'

import { requireRole, getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get Streams
export async function getStreams() {
  // 1. ROLE GUARD
  await requireRole(['ADMIN', 'TEACHER'])

  // 2. TENANT ID
  const tenantId = await getTenantId()

  // 4. TENANT ISOLATION
  const streams = await prisma.stream.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: { classes: true, cohorts: true, courses: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return streams
}

// Get Stream by ID
export async function getStreamById(id: string) {
  // 1. ROLE GUARD
  await requireRole(['ADMIN', 'TEACHER'])

  // 2. TENANT ID
  const tenantId = await getTenantId()

  // 4. OWNERSHIP CHECK + TENANT ISOLATION
  const stream = await prisma.stream.findFirst({
    where: { id, tenantId },
    include: {
      _count: {
        select: { classes: true, cohorts: true, courses: true },
      },
    },
  })

  return stream
}

