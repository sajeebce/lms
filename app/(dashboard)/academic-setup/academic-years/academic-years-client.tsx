'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Archive, Star, MoreVertical, Calendar, Lock } from 'lucide-react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import {
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  archiveAcademicYear,
  setAsCurrent,
  removeFromCurrent
} from './actions'

// Form validation schema with character limits
const formSchema = z.object({
  name: z.string()
    .min(1, 'Year name is required')
    .max(100, 'Year name must be 100 characters or less'),
  code: z.string()
    .min(1, 'Code is required')
    .max(20, 'Code must be 20 characters or less'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  state: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED']),
}).refine((data) => {
  // Validate end date > start date
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate)
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

type FormValues = z.infer<typeof formSchema>

// Helper function to calculate current state from dates
function getCurrentStateFromDates(startDate: string, endDate: string): string {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (now < start) {
    return '📋 Planned (not started yet)'
  } else if (now >= start && now <= end) {
    return '🎓 Active (currently running)'
  } else {
    return '✅ Completed (ended)'
  }
}

// Helper function to get status badge color
function getStatusBadgeClass(state: string): string {
  switch (state) {
    case 'PLANNED':
      return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800/30 dark:text-neutral-400'
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'COMPLETED':
      return 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300'
    case 'ARCHIVED':
      return 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800/30 dark:text-neutral-400'
    default:
      return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800/30 dark:text-neutral-400'
  }
}

// Helper function to get status icon
function getStatusIcon(state: string): string {
  switch (state) {
    case 'PLANNED':
      return '📋'
    case 'ACTIVE':
      return '🎓'
    case 'COMPLETED':
      return '✅'
    case 'ARCHIVED':
      return '📦'
    default:
      return '📋'
  }
}

// Helper function to get status label
function getStatusLabel(state: string): string {
  switch (state) {
    case 'PLANNED':
      return 'Planned'
    case 'ACTIVE':
      return 'Active'
    case 'COMPLETED':
      return 'Completed'
    case 'ARCHIVED':
      return 'Archived'
    default:
      return state
  }
}

type AcademicYear = {
  id: string
  name: string
  code: string
  startDate: Date
  endDate: Date
  state: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  isCurrent: boolean
  _count: {
    cohorts: number
  }
}

export function AcademicYearsClient({ academicYears }: { academicYears: AcademicYear[] }) {
  const [open, setOpen] = useState(false)
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [yearToDelete, setYearToDelete] = useState<AcademicYear | null>(null)
  const [yearToArchive, setYearToArchive] = useState<AcademicYear | null>(null)

  // React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      startDate: '',
      endDate: '',
      state: 'PLANNED',
    },
  })

  const onSubmit = async (values: FormValues) => {
    const result = editingYear
      ? await updateAcademicYear(editingYear.id, values)
      : await createAcademicYear(values)

    if (result.success) {
      toast.success(
        editingYear ? 'Academic year updated successfully' : 'Academic year created successfully'
      )
      setOpen(false)
      resetForm()
    } else {
      toast.error(result.error || 'An error occurred')
    }
  }

  const confirmDelete = async () => {
    if (!yearToDelete) return

    const result = await deleteAcademicYear(yearToDelete.id)
    if (result.success) {
      toast.success('Academic year deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete academic year')
    }
    setDeleteDialogOpen(false)
    setYearToDelete(null)
  }

  const confirmArchive = async () => {
    if (!yearToArchive) return

    const result = await archiveAcademicYear(yearToArchive.id)
    if (result.success) {
      toast.success('Academic year archived successfully')
    } else {
      toast.error(result.error || 'Failed to archive academic year')
    }
    setArchiveDialogOpen(false)
    setYearToArchive(null)
  }

  const handleSetAsCurrent = async (id: string) => {
    const result = await setAsCurrent(id)
    if (result.success) {
      toast.success('Year marked as current')
    } else {
      toast.error(result.error || 'Failed to set as current')
    }
  }

  const handleRemoveFromCurrent = async (id: string) => {
    const result = await removeFromCurrent(id)
    if (result.success) {
      toast.success('Removed from current')
    } else {
      toast.error(result.error || 'Failed to remove from current')
    }
  }

  const handleEdit = (year: AcademicYear) => {
    setEditingYear(year)
    form.reset({
      name: year.name,
      code: year.code,
      startDate: format(new Date(year.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(year.endDate), 'yyyy-MM-dd'),
      state: year.state,
    })
    setOpen(true)
  }

  const resetForm = () => {
    setEditingYear(null)
    form.reset({
      name: '',
      code: '',
      startDate: '',
      endDate: '',
      state: 'PLANNED',
    })
  }

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-card-foreground">All Academic Years</h2>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Academic Year
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingYear ? 'Edit Academic Year' : 'Add New Academic Year'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Name Field */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 2025-26"
                          maxLength={100}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the academic year name (max 100 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Code Field */}
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., AY-25-26"
                          maxLength={20}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Short code for the academic year (max 20 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Start Date + End Date (Side by Side) */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Year State */}
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year State *</FormLabel>
                      <FormControl>
                        <SearchableDropdown
                          options={[
                            { value: 'PLANNED', label: '📋 Planned' },
                            { value: 'ACTIVE', label: '🎓 Active' },
                            { value: 'COMPLETED', label: '✅ Completed' },
                            { value: 'ARCHIVED', label: '📦 Archived' },
                          ]}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select state"
                        />
                      </FormControl>
                      <FormDescription>
                        Current state of the academic year
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Current State Logic (NEW!) */}
                {form.watch('startDate') && form.watch('endDate') && (
                  <div className="rounded-lg border border-border bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Current state based on dates:</span>{' '}
                      {getCurrentStateFromDates(
                        form.watch('startDate'),
                        form.watch('endDate')
                      )}
                    </p>
                  </div>
                )}

                {/* Submit Button Only */}
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? 'Saving...' : editingYear ? 'Update Year' : 'Create Year'}
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
            <TableHead>Year Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Date Range</TableHead>
            <TableHead>State</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {academicYears.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No academic years found. Create your first academic year to get started.
              </TableCell>
            </TableRow>
          ) : (
            academicYears.map((year) => (
              <TableRow key={year.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {year.name}
                    {year.isCurrent && (
                      <Badge className="bg-white text-gray-700 border border-gray-300 hover:bg-white dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600">
                        Current
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{year.code}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(year.startDate), 'dd/MM/yyyy')} → {format(new Date(year.endDate), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeClass(year.state)}>
                    {getStatusIcon(year.state)} {getStatusLabel(year.state)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(year)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>

                      {year.isCurrent ? (
                        <DropdownMenuItem onClick={() => handleRemoveFromCurrent(year.id)}>
                          Remove from Current
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleSetAsCurrent(year.id)}>
                          Set as Current
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      {year.state !== 'ARCHIVED' && (
                        <DropdownMenuItem
                          onClick={() => {
                            setYearToArchive(year)
                            setArchiveDialogOpen(true)
                          }}
                          className="text-amber-600 dark:text-amber-400"
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() => {
                          if (year._count.cohorts > 0) {
                            toast.error('Cannot Delete', {
                              description: `This year has ${year._count.cohorts} cohort(s) linked. Please remove them first.`,
                            })
                            return
                          }
                          setYearToDelete(year)
                          setDeleteDialogOpen(true)
                        }}
                        className={year._count.cohorts > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}
                      >
                        {year._count.cohorts > 0 ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Locked ({year._count.cohorts} cohort{year._count.cohorts > 1 ? 's' : ''})
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Academic Year</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this academic year? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Academic Year</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this academic year? Archived years can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmArchive}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
