'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Lock, ArrowUp, ShieldAlert } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createClass, updateClass, deleteClass } from './actions'

// Form validation schema with character limits
const formSchema = z.object({
  name: z.string()
    .min(1, 'Class name is required')
    .max(100, 'Class name must be 100 characters or less'),
  alias: z.string()
    .max(50, 'Alias must be 50 characters or less')
    .optional(),
  streamId: z.string().optional(),
  order: z.number()
    .min(1, 'Order must be at least 1')
    .max(9999, 'Order must be 9999 or less'),
})

type FormValues = z.infer<typeof formSchema>

type ClassItem = {
  id: string
  name: string
  alias: string | null
  order: number
  stream: { id: string; name: string } | null
  _count: {
    cohorts: number
    sectionTemplates: number
  }
}

type Stream = {
  id: string
  name: string
}

export function ClassesClient({
  classes,
  streams,
}: {
  classes: ClassItem[]
  streams: Stream[]
}) {
  const [open, setOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null)

  // React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      alias: '',
      streamId: '',
      order: 1,
    },
  })

  const onSubmit = async (values: FormValues) => {
    const result = editingClass
      ? await updateClass(editingClass.id, {
          ...values,
          streamId: values.streamId && values.streamId !== 'none' ? values.streamId : undefined,
          alias: values.alias || undefined,
        })
      : await createClass({
          ...values,
          streamId: values.streamId && values.streamId !== 'none' ? values.streamId : undefined,
          alias: values.alias || undefined,
        })

    if (result.success) {
      toast.success(
        editingClass ? 'Class updated successfully' : 'Class created successfully'
      )
      setOpen(false)
      resetForm()
    } else {
      toast.error(result.error || 'An error occurred')
    }
  }

  const confirmDelete = async () => {
    if (!classToDelete) return

    const result = await deleteClass(classToDelete.id)
    if (result.success) {
      toast.success('Class deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete class')
    }
    setDeleteDialogOpen(false)
    setClassToDelete(null)
  }

  const handleEdit = (classItem: ClassItem) => {
    setEditingClass(classItem)
    form.reset({
      name: classItem.name,
      alias: classItem.alias || '',
      streamId: classItem.stream?.id || '',
      order: classItem.order,
    })
    setOpen(true)
  }

  const resetForm = () => {
    setEditingClass(null)
    form.reset({
      name: '',
      alias: '',
      streamId: '',
      order: classes.length > 0 ? Math.max(...classes.map((c) => c.order)) + 1 : 1,
    })
  }

  const isInUse = (cohortCount: number, templateCount: number) =>
    cohortCount > 0 || templateCount > 0

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-card-foreground">All Classes</h2>
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
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingClass ? 'Edit Class' : 'Add New Class'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Class Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Class 11, Grade 10"
                          maxLength={100}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the class name (max 100 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Alias */}
                <FormField
                  control={form.control}
                  name="alias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alias (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Grade 11"
                          maxLength={50}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Alternative name for the class (max 50 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Stream */}
                <FormField
                  control={form.control}
                  name="streamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stream (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stream" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {streams.map((stream) => (
                            <SelectItem key={stream.id} value={stream.id}>
                              {stream.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Assign a stream to this class
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Order */}
                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order (for promotions) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="9999"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription>
                        Lower numbers come first. Must be unique (1-9999).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button Only */}
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? 'Saving...' : editingClass ? 'Update' : 'Create'}
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
            <TableHead>
              <div className="flex items-center gap-1">
                Order <ArrowUp className="h-3 w-3" />
              </div>
            </TableHead>
            <TableHead>Class Name</TableHead>
            <TableHead>Alias</TableHead>
            <TableHead>Stream</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No classes found. Create your first class to get started.
              </TableCell>
            </TableRow>
          ) : (
            classes.map((classItem) => {
              const inUse = isInUse(
                classItem._count.cohorts,
                classItem._count.sectionTemplates
              )
              const nextOrder = classItem.order + 1
              const nextClass = classes.find((c) => c.order === nextOrder)

              return (
                <TableRow key={classItem.id}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {classItem.order}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{classItem.name}</TableCell>
                  <TableCell className="text-neutral-600">
                    {classItem.alias || '-'}
                  </TableCell>
                  <TableCell>
                    {classItem.stream ? (
                      <Badge className="bg-teal-50 text-teal-700 hover:bg-teal-50 dark:bg-teal-900/30 dark:text-teal-300">
                        {classItem.stream.name}
                      </Badge>
                    ) : (
                      <span className="text-neutral-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {classItem._count.cohorts > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {classItem._count.cohorts} cohort(s)
                        </span>
                      )}
                      {classItem._count.sectionTemplates > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {classItem._count.sectionTemplates} template(s)
                        </span>
                      )}
                      {nextClass && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-lime-50 text-lime-700 border-lime-200"
                        >
                          → {nextClass.name}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(classItem)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (inUse) {
                            toast.error('In Use', {
                              description: `Cannot delete: ${classItem._count.cohorts} cohort(s), ${classItem._count.sectionTemplates} template(s) linked`,
                            })
                            return
                          }
                          setClassToDelete(classItem)
                          setDeleteDialogOpen(true)
                        }}
                        disabled={inUse}
                        title={inUse ? 'In Use' : 'Delete class'}
                      >
                        {inUse ? (
                          <Lock className="h-4 w-4 text-amber-600" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-600" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-xl">Delete Class</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold text-foreground">{classToDelete?.name}</span>? This action cannot be undone.
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
