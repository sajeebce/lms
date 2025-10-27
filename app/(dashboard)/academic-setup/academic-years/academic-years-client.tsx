'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Archive, Star, MoreVertical, Calendar } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  archiveAcademicYear,
  setAsCurrent,
  removeFromCurrent
} from './actions'

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, 'Year name is required'),
  code: z.string().min(1, 'Code is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  state: z.enum(['PLANNED', 'ENROLLING', 'IN_SESSION', 'COMPLETED', 'ARCHIVED']),
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
    return '🟢 In Session (currently active)'
  } else {
    return '✅ Completed (ended)'
  }
}

// Helper function to get status badge color
function getStatusBadgeClass(state: string): string {
  switch (state) {
    case 'PLANNED':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    case 'ENROLLING':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
    case 'IN_SESSION':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    case 'COMPLETED':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    case 'ARCHIVED':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }
}

// Helper function to get status icon
function getStatusIcon(state: string): string {
  switch (state) {
    case 'PLANNED':
      return '📋'
    case 'ENROLLING':
      return '🚀'
    case 'IN_SESSION':
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
    case 'ENROLLING':
      return 'Enrolling'
    case 'IN_SESSION':
      return 'In Session'
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
  state: 'PLANNED' | 'ENROLLING' | 'IN_SESSION' | 'COMPLETED' | 'ARCHIVED'
  isCurrent: boolean
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
                        <Input placeholder="e.g., 2025-26" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the academic year name
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
                        <Input placeholder="e.g., AY-25-26" {...field} />
                      </FormControl>
                      <FormDescription>
                        Short code for the academic year
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PLANNED">📋 Planned</SelectItem>
                          <SelectItem value="ENROLLING">🚀 Enrolling</SelectItem>
                          <SelectItem value="IN_SESSION">🎓 In Session</SelectItem>
                          <SelectItem value="COMPLETED">✅ Completed</SelectItem>
                          <SelectItem value="ARCHIVED">📦 Archived</SelectItem>
                        </SelectContent>
                      </Select>
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
                    className="w-full bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-700 hover:to-orange-600 text-white font-medium"
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
                          setYearToDelete(year)
                          setDeleteDialogOpen(true)
                        }}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
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
