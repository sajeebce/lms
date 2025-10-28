'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Lock } from 'lucide-react'
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

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, 'Stream name is required'),
  note: z.string().optional(),
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

  const handleDelete = async (id: string, hasClasses: boolean) => {
    if (hasClasses) {
      toast.error('Used in Classes', {
        description: 'Cannot delete stream that is used in classes',
      })
      return
    }

    if (!confirm('Are you sure you want to delete this stream?')) return

    const result = await deleteStream(id)
    if (result.success) {
      toast.success('Stream deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete stream')
    }
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
                        <Input placeholder="e.g., Science, Commerce, Arts" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the academic stream or department name
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
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Buttons */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? 'Saving...' : editingStream ? 'Update' : 'Create'}
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
                      onClick={() => handleDelete(stream.id, stream._count.classes > 0)}
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
    </div>
  )
}

