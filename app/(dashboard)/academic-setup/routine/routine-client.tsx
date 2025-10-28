'use client'

import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Clock, ShieldAlert } from 'lucide-react'
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
import { toast } from 'sonner'
import { createRoutine, updateRoutine, deleteRoutine } from './actions'

// Form validation schema
const formSchema = z.object({
  sectionId: z.string().min(1, 'Section is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
  roomId: z.string().min(1, 'Room is required'),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
})

type FormValues = z.infer<typeof formSchema>

type Routine = {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  section: {
    id: string
    name: string
    cohort: {
      branch: { id: string; name: string }
      class: { name: string }
    }
  }
  teacher: { id: string; name: string }
  room: { id: string; name: string }
}

type Branch = { id: string; name: string }
type Section = {
  id: string
  name: string
  cohort: {
    branch: { id: string; name: string }
    class: { name: string }
  }
}
type Teacher = { id: string; name: string }
type Room = { id: string; name: string }

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function RoutineClient({
  routines,
  branches,
  sections,
  teachers,
  rooms,
}: {
  routines: Routine[]
  branches: Branch[]
  sections: Section[]
  teachers: Teacher[]
  rooms: Room[]
}) {
  const [open, setOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null)

  // React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sectionId: '',
      teacherId: '',
      roomId: '',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:00',
    },
  })

  // Filters
  const [filters, setFilters] = useState({
    branchId: '',
    sectionId: '',
    dayOfWeek: '',
  })

  const filteredSections = useMemo(() => {
    if (!filters.branchId || filters.branchId === 'all') return sections
    return sections.filter((s) => s.cohort.branch.id === filters.branchId)
  }, [sections, filters.branchId])

  const filteredRoutines = useMemo(() => {
    return routines.filter((routine) => {
      if (filters.branchId && filters.branchId !== 'all' && routine.section.cohort.branch.id !== filters.branchId)
        return false
      if (filters.sectionId && filters.sectionId !== 'all' && routine.section.id !== filters.sectionId) return false
      if (filters.dayOfWeek && filters.dayOfWeek !== 'all' && routine.dayOfWeek !== parseInt(filters.dayOfWeek))
        return false
      return true
    })
  }, [routines, filters])

  const onSubmit = async (values: FormValues) => {
    const result = editingRoutine
      ? await updateRoutine(editingRoutine.id, values)
      : await createRoutine(values)

    if (result.success) {
      toast.success(
        editingRoutine
          ? 'Routine updated successfully'
          : 'Routine created successfully'
      )
      setOpen(false)
      resetForm()
    } else {
      toast.error(result.error || 'An error occurred')
    }
  }

  const confirmDelete = async () => {
    if (!routineToDelete) return

    const result = await deleteRoutine(routineToDelete.id)
    if (result.success) {
      toast.success('Routine deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete routine')
    }
    setDeleteDialogOpen(false)
    setRoutineToDelete(null)
  }

  const handleEdit = (routine: Routine) => {
    setEditingRoutine(routine)
    form.reset({
      sectionId: routine.section.id,
      teacherId: routine.teacher.id,
      roomId: routine.room.id,
      dayOfWeek: routine.dayOfWeek,
      startTime: routine.startTime,
      endTime: routine.endTime,
    })
    setOpen(true)
  }

  const resetForm = () => {
    setEditingRoutine(null)
    form.reset({
      sectionId: '',
      teacherId: '',
      roomId: '',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:00',
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs">Branch</Label>
            <Select
              value={filters.branchId}
              onValueChange={(value) => {
                setFilters({ ...filters, branchId: value, sectionId: '' })
              }}
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
            <Label className="text-xs">Section</Label>
            <Select
              value={filters.sectionId}
              onValueChange={(value) => setFilters({ ...filters, sectionId: value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {filteredSections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name} ({section.cohort.class.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Day of Week</Label>
            <Select
              value={filters.dayOfWeek}
              onValueChange={(value) => setFilters({ ...filters, dayOfWeek: value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {DAYS.map((day, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-card-foreground">
            Schedule ({filteredRoutines.length})
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
                Add Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingRoutine ? 'Edit Session' : 'Add New Session'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Section */}
                  <FormField
                    control={form.control}
                    name="sectionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sections.map((section) => (
                              <SelectItem key={section.id} value={section.id}>
                                {section.name} ({section.cohort.class.name} -{' '}
                                {section.cohort.branch.name})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Teacher */}
                  <FormField
                    control={form.control}
                    name="teacherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teacher *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select teacher" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Room */}
                  <FormField
                    control={form.control}
                    name="roomId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select room" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {rooms.map((room) => (
                              <SelectItem key={room.id} value={room.id}>
                                {room.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Day of Week */}
                  <FormField
                    control={form.control}
                    name="dayOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day of Week *</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DAYS.map((day, idx) => (
                              <SelectItem key={idx} value={idx.toString()}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Start Time + End Time (Side by Side) */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time *</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time *</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Submit Button Only */}
                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? 'Saving...' : editingRoutine ? 'Update' : 'Create'}
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
              <TableHead>Day</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Room</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoutines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No routines found. Create your first session to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredRoutines.map((routine) => (
                <TableRow key={routine.id}>
                  <TableCell>
                    <Badge variant="outline">{DAYS[routine.dayOfWeek]}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {routine.startTime} - {routine.endTime}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {routine.section.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-violet-50 text-violet-700 hover:bg-violet-50 dark:bg-violet-900/30 dark:text-violet-300">
                      {routine.teacher.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300">
                      {routine.room.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(routine)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRoutineToDelete(routine)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
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
              <AlertDialogTitle className="text-xl">Delete Routine</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete this routine session? This action cannot be undone.
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
