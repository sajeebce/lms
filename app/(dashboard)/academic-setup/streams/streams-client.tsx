'use client'

import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { createStream, updateStream, deleteStream } from './actions'

// Form validation schema with character limits
const formSchema = z.object({
  name: z.string()
    .min(1, 'Stream name is required')
    .max(100, 'Stream name must be 100 characters or less'),
  note: z.string()
    .max(500, 'Note must be 500 characters or less')
    .optional(),
})

type FormValues = z.infer<typeof formSchema>

type Stream = {
  id: string
  name: string
  note: string | null
  _count: {
    classes: number
  }
}

export function StreamsClient({ streams }: { streams: Stream[] }) {
  const [open, setOpen] = useState(false)
  const [editingStream, setEditingStream] = useState<Stream | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [streamToDelete, setStreamToDelete] = useState<Stream | null>(null)

  // React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      note: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    const result = editingStream
      ? await updateStream(editingStream.id, values)
      : await createStream(values)

    if (result.success) {
      toast.success(
        editingStream ? 'Stream updated successfully' : 'Stream created successfully'
      )
      setOpen(false)
      resetForm()
    } else {
      toast.error(result.error || 'An error occurred')
    }
  }

  const confirmDelete = async () => {
    if (!streamToDelete) return

    const result = await deleteStream(streamToDelete.id)
    if (result.success) {
      toast.success('Stream deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete stream')
    }
    setDeleteDialogOpen(false)
    setStreamToDelete(null)
  }

  const handleEdit = (stream: Stream) => {
    setEditingStream(stream)
    form.reset({
      name: stream.name,
      note: stream.note || '',
    })
    setOpen(true)
  }

  const resetForm = () => {
    setEditingStream(null)
    form.reset({
      name: '',
      note: '',
    })
  }

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-card-foreground">All Streams</h2>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Stream
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingStream ? 'Edit Stream' : 'Add New Stream'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Stream Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stream Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Science, Commerce, Arts"
                          maxLength={100}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the academic stream or department name (max 100 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Note */}
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Optional description about this stream"
                          className="resize-none"
                          rows={3}
                          maxLength={500}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Max 500 characters
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
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                  >
                    {form.formState.isSubmitting ? 'Saving...' : editingStream ? 'Update Stream' : 'Create Stream'}
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
            <TableHead>Stream Name</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Classes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {streams.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No streams found. Create your first stream to get started.
              </TableCell>
            </TableRow>
          ) : (
            streams.map((stream) => (
              <TableRow key={stream.id}>
                <TableCell className="font-medium">{stream.name}</TableCell>
                <TableCell className="text-muted-foreground">{stream.note || '-'}</TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {stream._count.classes} {stream._count.classes === 1 ? 'class' : 'classes'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(stream)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (stream._count.classes > 0) {
                          toast.error('Used in Classes', {
                            description: 'Cannot delete stream that is used in classes',
                          })
                          return
                        }
                        setStreamToDelete(stream)
                        setDeleteDialogOpen(true)
                      }}
                      disabled={stream._count.classes > 0}
                      title={stream._count.classes > 0 ? 'Used in Classes' : 'Delete stream'}
                    >
                      {stream._count.classes > 0 ? (
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-xl">Delete Stream</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold text-foreground">{streamToDelete?.name}</span>? This action cannot be undone.
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
