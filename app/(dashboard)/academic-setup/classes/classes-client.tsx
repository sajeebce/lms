'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Lock, ArrowUp } from 'lucide-react'
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

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  alias: z.string().optional(),
  streamId: z.string().optional(),
  order: z.number().min(1, 'Order must be at least 1'),
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

  const handleDelete = async (
    id: string,
    cohortCount: number,
    templateCount: number
  ) => {
    if (cohortCount > 0 || templateCount > 0) {
      toast.error('In Use', {
        description: `Cannot delete: ${cohortCount} cohort(s), ${templateCount} template(s) linked`,
      })
      return
    }

    if (!confirm('Are you sure you want to delete this class?')) return

    const result = await deleteClass(id)
    if (result.success) {
      toast.success('Class deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete class')
    }
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
                        <Input placeholder="e.g., Class 11, Grade 10" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the class name
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
                        <Input placeholder="e.g., Grade 11" {...field} />
                      </FormControl>
                      <FormDescription>
                        Alternative name for the class
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
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription>
                        Lower numbers come first. Must be unique.
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
                        onClick={() =>
                          handleDelete(
                            classItem.id,
                            classItem._count.cohorts,
                            classItem._count.sectionTemplates
                          )
                        }
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
    </div>
  )
}

