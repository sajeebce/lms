import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'
import { PageHeader } from '@/components/page-header'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { StudentsClient } from './students-client'

export default async function StudentsPage() {
  await requireRole('ADMIN')
  const tenantId = await getTenantId()

  // Fetch tenant settings for phone prefix
  const tenantSettings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  })
  const phonePrefix = tenantSettings?.phonePrefix || '+1'

  // Fetch all students with their enrollments
  const students = await prisma.student.findMany({
    where: { tenantId },
    include: {
      user: true,
      guardians: true,
      enrollments: {
        include: {
          section: true,
          cohort: {
            include: {
              year: true,
              class: true,
            },
          },
          academicYear: true,
          class: true,
          branch: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Students"
          description="Manage all admitted students"
          icon={Users}
          bgColor="bg-green-50"
          iconBgColor="bg-green-600"
        />
        <Link href="/students/admission">
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Admit New Student
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Students ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No students admitted yet.</p>
              <Link href="/students/admission">
                <Button variant="link">Admit the first student</Button>
              </Link>
            </div>
          ) : (
            <StudentsClient students={students} phonePrefix={phonePrefix} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

