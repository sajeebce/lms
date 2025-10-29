import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'
import { PageHeader } from '@/components/page-header'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function StudentsPage() {
  await requireRole('ADMIN')
  const tenantId = await getTenantId()

  // Fetch all students with their enrollments
  const students = await prisma.student.findMany({
    where: { tenantId },
    include: {
      user: true,
      enrollments: {
        include: {
          section: {
            include: {
              cohort: {
                include: {
                  year: true,
                  class: true,
                  stream: true,
                },
              },
            },
          },
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const enrollment = student.enrollments[0]
                    const cohort = enrollment?.section?.cohort

                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.user.name}</TableCell>
                        <TableCell>{student.user.email}</TableCell>
                        <TableCell>{student.user.phone || '-'}</TableCell>
                        <TableCell>{cohort?.class?.name || '-'}</TableCell>
                        <TableCell>{enrollment?.section?.name || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={student.status === 'ACTIVE' ? 'default' : 'secondary'}
                          >
                            {student.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

