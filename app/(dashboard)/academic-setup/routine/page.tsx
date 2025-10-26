import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { RoutineClient } from './routine-client'

export default async function RoutinePage() {
  const tenantId = await getTenantId()

  const [routines, branches, sections, teachers, rooms] = await Promise.all([
    prisma.routine.findMany({
      where: { tenantId },
      include: {
        section: {
          include: {
            cohort: {
              include: {
                branch: true,
                class: true,
              },
            },
          },
        },
        teacher: true,
        room: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    }),
    prisma.branch.findMany({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    }),
    prisma.section.findMany({
      where: { tenantId },
      include: {
        cohort: {
          include: {
            branch: true,
            class: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.teacher.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    }),
    prisma.room.findMany({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg p-6 border border-violet-100">
        <h1 className="text-2xl font-bold text-neutral-900">Routine / Timetable</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Manage class schedules and timetables
        </p>
      </div>
      <RoutineClient
        routines={routines}
        branches={branches}
        sections={sections}
        teachers={teachers}
        rooms={rooms}
      />
    </div>
  )
}

