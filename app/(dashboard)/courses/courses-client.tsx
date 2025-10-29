'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { toast } from 'sonner'
import { createCourse, updateCourse, deleteCourse } from './actions'
import { EnrollmentDialog } from './enrollment-dialog'
import { BookOpen, Plus, Users, Pencil, Trash2, Lock, ShieldAlert } from 'lucide-react'

type Course = {
  id: string
  name: string
  code: string
  description?: string
  credits?: number
  _count: { enrollments: number }
}
type AcademicYear = { id: string; name: string }
type Class = { id: string; name: string }
type Section = { id: string; name: string }
type Branch = { id: string; name: string }
type Cohort = { id: string; name: string }

const courseSchema = z.object({
  name: z.string().min(1, 'Course name is required'),
  code: z.string().min(1, 'Course code is required'),
  description: z.string().optional(),
  credits: z.number().optional(),
})

type FormValues = z.infer<typeof courseSchema>

export function CoursesClient({
  courses: initialCourses,
  academicYears,
  classes,
  sections,
  branches,
  cohorts,
  enableCohorts,
}: {
  courses: Course[]
  academicYears: AcademicYear[]
  classes: Class[]
  sections: Section[]
  branches: Branch[]
  cohorts: Cohort[]
  enableCohorts: boolean
}) {
  const [courses, setCourses] = useState(initialCourses)
  const [open, setOpen] = useState(false)
  const [enrollmentOpen, setEnrollmentOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      credits: undefined,
    },
  })

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    const result = editingCourse
      ? await updateCourse(editingCourse.id, data)
      : await createCourse(data)
    setLoading(false)

    if (result.success) {
      toast.success(editingCourse ? 'Course updated successfully! 🎉' : 'Course created successfully! 🎉')
      form.reset()
      setOpen(false)
      setEditingCourse(null)
      // Refresh courses list
      window.location.reload()
    } else {
      toast.error(result.error || `Failed to ${editingCourse ? 'update' : 'create'} course`)
    }
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    form.reset({
      name: course.name,
      code: course.code,
      description: course.description || '',
      credits: course.credits,
    })
    setOpen(true)
  }

  const confirmDelete = async () => {
    if (!courseToDelete) return

    const result = await deleteCourse(courseToDelete.id)
    if (result.success) {
      toast.success('Course deleted successfully')
      window.location.reload()
    } else {
      toast.error(result.error || 'Failed to delete course')
    }
    setDeleteDialogOpen(false)
    setCourseToDelete(null)
  }

  const handleEnrollClick = (course: Course) => {
    setSelectedCourse(course)
    setEnrollmentOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Create/Edit Course Dialog */}
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) {
            setEditingCourse(null)
            form.reset()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
            <DialogDescription>
              {editingCourse ? 'Update course information' : 'Add a new course to the system'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Course Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Mathematics"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="code">Course Code *</Label>
              <Input
                id="code"
                placeholder="e.g., MATH101"
                {...form.register('code')}
              />
              {form.formState.errors.code && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.code.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Course description"
                {...form.register('description')}
              />
            </div>

            <div>
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                placeholder="e.g., 3"
                {...form.register('credits', { valueAsNumber: true })}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Course'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enrollment Dialog */}
      {selectedCourse && (
        <EnrollmentDialog
          course={selectedCourse}
          academicYears={academicYears}
          classes={classes}
          sections={sections}
          branches={branches}
          cohorts={cohorts}
          enableCohorts={enableCohorts}
          open={enrollmentOpen}
          onOpenChange={setEnrollmentOpen}
        />
      )}

      {/* Courses Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Courses ({courses.length})</CardTitle>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </CardHeader>

        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No courses created yet.</p>
              <Button variant="link" onClick={() => setOpen(true)}>
                Create the first course
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                    <TableHead>Course Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{course.code}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {course.description || '-'}
                      </TableCell>
                      <TableCell>{course.credits || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{course._count.enrollments}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEnrollClick(course)}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Enroll
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(course)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (course._count.enrollments > 0) {
                                toast.error('Cannot Delete', {
                                  description: `This course has ${course._count.enrollments} student${course._count.enrollments > 1 ? 's' : ''} enrolled. Please remove them first.`,
                                })
                                return
                              }
                              setCourseToDelete(course)
                              setDeleteDialogOpen(true)
                            }}
                            disabled={course._count.enrollments > 0}
                            className={course._count.enrollments > 0 ? 'cursor-not-allowed' : ''}
                          >
                            {course._count.enrollments > 0 ? (
                              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-600" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-xl">Delete Course</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold text-foreground">{courseToDelete?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

