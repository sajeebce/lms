'use client'

import { useState } from 'react'
import { Trash2, ShieldAlert, Eye, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CopyablePhone, CopyableEmail } from '@/components/ui/copyable-contact'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { deleteStudent, getStudentWithEnrollments } from './actions'

type Student = {
  id: string
  studentId: string | null
  name: string
  email: string | null
  phone: string | null
  status: string
  user: {
    name: string
    email: string
  }
  guardians: Array<{
    name: string
    relationship: string
    phone: string
  }>
  enrollments: Array<{
    section: {
      name: string
    }
    cohort: {
      year: { name: string }
      class: { name: string }
    } | null
    academicYear: { name: string }
    class: { name: string }
    branch: { name: string }
  }>
}

type EnrollmentInfo = {
  sections: number
  courses: number
  total: number
}

type StudentsClientProps = {
  students: Student[]
  phonePrefix?: string
}

export function StudentsClient({ students, phonePrefix = '+1' }: StudentsClientProps) {
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false)
  const [enrollmentInfo, setEnrollmentInfo] = useState<EnrollmentInfo | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = async (student: Student) => {
    setStudentToDelete(student)
    setIsDeleting(false)

    // Check if student has enrollments
    const result = await deleteStudent(student.id, false)

    if (result.needsConfirmation && result.enrollmentCount) {
      // Show enrollment modal
      setEnrollmentInfo(result.enrollmentCount)
      setEnrollmentModalOpen(true)
    } else if (result.success) {
      // No enrollments, show simple delete confirmation
      setDeleteDialogOpen(true)
    } else {
      toast.error(result.error || 'Failed to check student status')
    }
  }

  const confirmDeleteWithEnrollments = async () => {
    if (!studentToDelete) return

    setIsDeleting(true)
    const result = await deleteStudent(studentToDelete.id, true)

    if (result.success) {
      toast.success('Student deleted successfully', {
        description: 'All enrollments have been removed.',
      })
      setEnrollmentModalOpen(false)
      setStudentToDelete(null)
      setEnrollmentInfo(null)
    } else {
      toast.error(result.error || 'Failed to delete student')
    }
    setIsDeleting(false)
  }

  const confirmDeleteSimple = async () => {
    if (!studentToDelete) return

    setIsDeleting(true)
    const result = await deleteStudent(studentToDelete.id, true)

    if (result.success) {
      toast.success('Student deleted successfully')
      setDeleteDialogOpen(false)
      setStudentToDelete(null)
    } else {
      toast.error(result.error || 'Failed to delete student')
    }
    setIsDeleting(false)
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table className="text-foreground">
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No students admitted yet.
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => {
                const enrollment = student.enrollments[0]
                const className = enrollment?.cohort?.class?.name || enrollment?.class?.name || '-'

                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      {student.email ? (
                        <CopyableEmail email={student.email} />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {student.phone ? (
                        <CopyablePhone phone={student.phone} prefix={phonePrefix} />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{className}</TableCell>
                    <TableCell>{enrollment?.section?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={student.status === 'ACTIVE' ? 'default' : 'secondary'}
                      >
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/students/${student.id}`}>
                          <Button variant="ghost" size="sm" title="View Profile">
                            <Eye className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                          </Button>
                        </Link>
                        <Link href={`/students/${student.id}/edit`}>
                          <Button variant="ghost" size="sm" title="Edit Student">
                            <Edit className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(student)}
                          title="Delete Student"
                        >
                          <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Enrollment Warning Modal */}
      <Dialog open={enrollmentModalOpen} onOpenChange={setEnrollmentModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <DialogTitle className="text-xl">Student Has Active Enrollments</DialogTitle>
            </div>
            <DialogDescription className="text-base pt-2">
              <span className="font-semibold text-foreground">{studentToDelete?.name}</span> is currently enrolled in:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {enrollmentInfo && (
              <>
                {enrollmentInfo.sections > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Section Enrollments
                    </span>
                    <Badge className="bg-blue-600 text-white">
                      {enrollmentInfo.sections}
                    </Badge>
                  </div>
                )}
                {enrollmentInfo.courses > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                      Course Enrollments
                    </span>
                    <Badge className="bg-purple-600 text-white">
                      {enrollmentInfo.courses}
                    </Badge>
                  </div>
                )}
              </>
            )}

            <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-900 dark:text-red-100 font-medium">
                ?? Warning: This action cannot be undone
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                Deleting this student will permanently remove all enrollment records and user account.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEnrollmentModalOpen(false)
                setStudentToDelete(null)
                setEnrollmentInfo(null)
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteWithEnrollments}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simple Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-xl">Delete Student</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold text-foreground">{studentToDelete?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="mt-0" disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSimple}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}


