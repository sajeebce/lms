'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Lock } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createStream, updateStream, deleteStream } from './actions'

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
  const [formData, setFormData] = useState({
    name: '',
    note: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = editingStream
      ? await updateStream(editingStream.id, formData)
      : await createStream(formData)

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
    setFormData({
      name: stream.name,
      note: stream.note || '',
    })
    setOpen(true)
  }

  const resetForm = () => {
    setEditingStream(null)
    setFormData({
      name: '',
      note: '',
    })
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200">
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">All Streams</h2>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Stream
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingStream ? 'Edit Stream' : 'Add New Stream'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Stream Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="e.g., Science, Commerce, Arts"
                />
              </div>
              <div>
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  placeholder="Optional description"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700">
                  {editingStream ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-violet-50/50">
            <TableHead>Stream Name</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Classes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {streams.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-neutral-500 py-8">
                No streams found. Create your first stream to get started.
              </TableCell>
            </TableRow>
          ) : (
            streams.map((stream) => (
              <TableRow key={stream.id}>
                <TableCell className="font-medium">{stream.name}</TableCell>
                <TableCell className="text-neutral-600">{stream.note || '-'}</TableCell>
                <TableCell>
                  <span className="text-sm text-neutral-600">
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

