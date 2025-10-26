'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Info } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  createSectionTemplate,
  updateSectionTemplate,
  deleteSectionTemplate,
} from './actions'

type Template = {
  id: string
  name: string
  capacity: number
  note: string | null
  class: { id: string; name: string }
}

type Class = { id: string; name: string }

export function SectionTemplatesClient({
  templates,
  classes,
}: {
  templates: Template[]
  classes: Class[]
}) {
  const [open, setOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    classId: '',
    capacity: 40,
    note: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = editingTemplate
      ? await updateSectionTemplate(editingTemplate.id, {
          ...formData,
          note: formData.note || undefined,
        })
      : await createSectionTemplate({
          ...formData,
          note: formData.note || undefined,
        })

    if (result.success) {
      toast.success(
        editingTemplate
          ? 'Template updated successfully'
          : 'Template created successfully'
      )
      setOpen(false)
      resetForm()
    } else {
      toast.error(result.error || 'An error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this template? This only affects future cohort generation.'
      )
    )
      return

    const result = await deleteSectionTemplate(id)
    if (result.success) {
      toast.success('Template deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete template')
    }
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      classId: template.class.id,
      capacity: template.capacity,
      note: template.note || '',
    })
    setOpen(true)
  }

  const resetForm = () => {
    setEditingTemplate(null)
    setFormData({
      name: '',
      classId: '',
      capacity: 40,
      note: '',
    })
  }

  return (
    <div className="space-y-4">
      {/* Info Card */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-teal-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-teal-900">
            Safe to delete, future only
          </p>
          <p className="text-xs text-teal-700 mt-1">
            Templates are used by the Year Wizard to auto-generate sections. Deleting
            a template only affects future cohort generation, not existing sections.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-neutral-200">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            All Templates ({templates.length})
          </h2>
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o)
              if (!o) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-violet-600 hover:bg-violet-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Edit Template' : 'Add New Template'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="classId">Class *</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, classId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="e.g., Section A, Section B"
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Maximum number of students per section
                  </p>
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
                    {editingTemplate ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-violet-50/50">
              <TableHead>Class</TableHead>
              <TableHead>Template Name</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-neutral-500 py-8">
                  No templates found. Create your first template to get started.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <Badge className="bg-violet-50 text-violet-700 hover:bg-violet-50">
                      {template.class.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{template.capacity} students</Badge>
                  </TableCell>
                  <TableCell className="text-neutral-600 text-sm">
                    {template.note || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
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
    </div>
  )
}

