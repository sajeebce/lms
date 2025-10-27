import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { RoutineClient } from './routine-client'
import { PageHeader } from '@/components/page-header'
import { CalendarClock } from 'lucide-react'

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
      <PageHeader
        title="Routine / Timetable"
        description="Manage class schedules and timetables"
        icon={CalendarClock}
        bgColor="bg-lime-50"
        iconBgColor="bg-green-600"
      />
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

