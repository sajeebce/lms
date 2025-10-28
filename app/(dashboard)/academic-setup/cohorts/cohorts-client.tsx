'use client'

import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Lock, ShieldAlert } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  createCohort,
  updateCohort,
  deleteCohort,
  toggleEnrollmentOpen,
} from './actions'

// Form validation schema with character limits
const formSchema = z.object({
  name: z.string()
    .min(1, 'Cohort name is required')
    .max(100, 'Cohort name must be 100 characters or less'),
  yearId: z.string().min(1, 'Academic year is required'),
  classId: z.string().min(1, 'Class is required'),
  streamId: z.string().optional(),
  branchId: z.string().min(1, 'Branch is required'),
  status: z.enum(['PLANNED', 'RUNNING', 'FINISHED', 'ARCHIVED']),
  enrollmentOpen: z.boolean(),
  startDate: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

type Cohort = {
  id: string
  name: string
  status: 'PLANNED' | 'RUNNING' | 'FINISHED' | 'ARCHIVED'
  enrollmentOpen: boolean
  startDate: Date | null
  year: { id: string; name: string }
  class: { id: string; name: string }
  stream: { id: string; name: string } | null
  branch: { id: string; name: string }
  _count: { sections: number }
}

type Branch = { id: string; name: string }
type AcademicYear = { id: string; name: string }
type Class = { id: string; name: string }
type Stream = { id: string; name: string }

export function CohortsClient({
  cohorts,
  branches,
  academicYears,
  classes,
  streams,
}: {
  cohorts: Cohort[]
  branches: Branch[]
  academicYears: AcademicYear[]
  classes: Class[]
  streams: Stream[]
}) {
  const [open, setOpen] = useState(false)
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cohortToDelete, setCohortToDelete] = useState<Cohort | null>(null)

  // React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      yearId: '',
      classId: '',
      streamId: '',
      branchId: '',
      status: 'PLANNED',
      enrollmentOpen: false,
      startDate: '',
    },
  })

  // Filters
  const [filters, setFilters] = useState({
    branchId: '',
    yearId: '',
    classId: '',
    status: '',
    enrollmentOpen: '',
  })

  const filteredCohorts = useMemo(() => {
    return cohorts.filter((cohort) => {
      if (filters.branchId && filters.branchId !== 'all' && cohort.branch.id !== filters.branchId) return false
      if (filters.yearId && filters.yearId !== 'all' && cohort.year.id !== filters.yearId) return false
      if (filters.classId && filters.classId !== 'all' && cohort.class.id !== filters.classId) return false
      if (filters.status && filters.status !== 'all' && cohort.status !== filters.status) return false
      if (filters.enrollmentOpen === 'true' && !cohort.enrollmentOpen) return false
      if (filters.enrollmentOpen === 'false' && cohort.enrollmentOpen) return false
      return true
    })
  }, [cohorts, filters])

  const onSubmit = async (values: FormValues) => {
    // Convert __none__ to empty string for streamId
    const submissionData = {
      ...values,
      streamId: values.streamId === '__none__' ? '' : values.streamId,
    }

    const result = editingCohort
      ? await updateCohort(editingCohort.id, submissionData)
      : await createCohort(submissionData)

    if (result.success) {
      toast.success(
        editingCohort ? 'Cohort updated successfully' : 'Cohort created successfully'
      )
      setOpen(false)
      resetForm()
    } else {
      toast.error(result.error || 'An error occurred')
    }
  }

  const handleToggleEnrollment = async (id: string, currentValue: boolean) => {
    const result = await toggleEnrollmentOpen(id, !currentValue)
    if (result.success) {
      toast.success(
        !currentValue ? 'Enrollment opened' : 'Enrollment closed',
        { description: !currentValue ? 'Students can now enroll' : 'Enrollment is now closed' }
      )
    } else {
      toast.error(result.error || 'Failed to toggle enrollment')
    }
  }

  const confirmDelete = async () => {
    if (!cohortToDelete) return

    const result = await deleteCohort(cohortToDelete.id)
    if (result.success) {
      toast.success('Cohort deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete cohort')
    }
    setDeleteDialogOpen(false)
    setCohortToDelete(null)
  }

  const handleEdit = (cohort: Cohort) => {
    setEditingCohort(cohort)
    form.reset({
      name: cohort.name,
      yearId: cohort.year.id,
      classId: cohort.class.id,
      streamId: cohort.stream?.id || '__none__',
      branchId: cohort.branch.id,
      status: cohort.status,
      enrollmentOpen: cohort.enrollmentOpen,
      startDate: cohort.startDate ? new Date(cohort.startDate).toISOString().split('T')[0] : '',
    })
    setOpen(true)
  }

  const resetForm = () => {
    setEditingCohort(null)
    form.reset({
      name: '',
      yearId: '',
      classId: '',
      streamId: '__none__',
      branchId: '',
      status: 'PLANNED',
      enrollmentOpen: false,
      startDate: '',
    })
  }

  const getStatusBadge = (status: Cohort['status']) => {
    const styles = {
      PLANNED: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800/30 dark:text-neutral-400',
      RUNNING: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      FINISHED: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300',
      ARCHIVED: 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800/30 dark:text-neutral-400',
    }
    return (
      <Badge className={`${styles[status]} hover:${styles[status]}`}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label className="text-xs">Branch</Label>
            <Select
              value={filters.branchId}
              onValueChange={(value) =>
                setFilters({ ...filters, branchId: value })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Academic Year</Label>
            <Select
              value={filters.yearId}
              onValueChange={(value) => setFilters({ ...filters, yearId: value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Class</Label>
            <Select
              value={filters.classId}
              onValueChange={(value) =>
                setFilters({ ...filters, classId: value })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="PLANNED">PLANNED</SelectItem>
                <SelectItem value="RUNNING">RUNNING</SelectItem>
                <SelectItem value="FINISHED">FINISHED</SelectItem>
                <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Enrollment</Label>
            <Select
              value={filters.enrollmentOpen}
              onValueChange={(value) =>
                setFilters({ ...filters, enrollmentOpen: value })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Open</SelectItem>
                <SelectItem value="false">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-card-foreground">
            All Cohorts ({filteredCohorts.length})
          </h2>
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o)
              if (!o) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Cohort
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCohort ? 'Edit Cohort' : 'Add New Cohort'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Cohort Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cohort Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 2025 Intake, Morning Batch"
                            maxLength={100}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the cohort name (max 100 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Academic Year + Class (Side by Side) */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="yearId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Academic Year *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {academicYears.map((year) => (
                                <SelectItem key={year.id} value={year.id}>
                                  {year.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="classId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select class" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                  {cls.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Stream + Branch (Side by Side) */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="streamId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stream (Optional)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="No stream" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="__none__">No Stream</SelectItem>
                              {streams.map((stream) => (
                                <SelectItem key={stream.id} value={stream.id}>
                                  {stream.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">
                            For Class 9-12 (Science/Commerce/Arts)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="branchId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select branch" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {branches.map((branch) => (
                                <SelectItem key={branch.id} value={branch.id}>
                                  {branch.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Start Date (Optional) */}
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          When did this cohort start?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PLANNED">PLANNED</SelectItem>
                            <SelectItem value="RUNNING">RUNNING</SelectItem>
                            <SelectItem value="FINISHED">FINISHED</SelectItem>
                            <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Enrollment Open */}
                  <FormField
                    control={form.control}
                    name="enrollmentOpen"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Enrollment Open</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Submit Button Only */}
                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? 'Saving...' : editingCohort ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-violet-50/50 dark:bg-slate-800/50">
              <TableHead>Cohort Name</TableHead>
              <TableHead>Academic Year</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Stream</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enrollment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCohorts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No cohorts found. Create your first cohort to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredCohorts.map((cohort) => (
                <TableRow key={cohort.id}>
                  <TableCell className="font-medium">{cohort.name}</TableCell>
                  <TableCell>{cohort.year.name}</TableCell>
                  <TableCell>{cohort.class.name}</TableCell>
                  <TableCell>
                    {cohort.stream ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300">
                        {cohort.stream.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>{cohort.branch.name}</TableCell>
                  <TableCell>{getStatusBadge(cohort.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={cohort.enrollmentOpen}
                        onCheckedChange={() =>
                          handleToggleEnrollment(cohort.id, cohort.enrollmentOpen)
                        }
                      />
                      <Badge
                        className={
                          cohort.enrollmentOpen
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300'
                        }
                      >
                        {cohort.enrollmentOpen ? 'Open' : 'Closed'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(cohort)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (cohort._count.sections > 0) {
                            toast.error('Cannot delete', {
                              description: `${cohort._count.sections} section(s) linked to this cohort`,
                            })
                            return
                          }
                          setCohortToDelete(cohort)
                          setDeleteDialogOpen(true)
                        }}
                        disabled={cohort._count.sections > 0}
                        title={
                          cohort._count.sections > 0
                            ? `${cohort._count.sections} section(s) linked`
                            : 'Delete cohort'
                        }
                      >
                        {cohort._count.sections > 0 ? (
                          <Lock className="h-4 w-4 text-amber-600" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-600" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-xl">Delete Cohort</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold text-foreground">{cohortToDelete?.name}</span>? This action cannot be undone.
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
