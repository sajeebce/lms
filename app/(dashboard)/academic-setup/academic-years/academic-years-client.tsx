'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Archive, Star } from 'lucide-react'
import { format } from 'date-fns'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createAcademicYear, updateAcademicYear, deleteAcademicYear, archiveAcademicYear } from './actions'

type AcademicYear = {
  id: string
  name: string
  code: string
  startDate: Date
  endDate: Date
  state: 'PLANNED' | 'IN_SESSION' | 'COMPLETED' | 'ARCHIVED'
}

export function AcademicYearsClient({ academicYears }: { academicYears: AcademicYear[] }) {
  const [open, setOpen] = useState(false)
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    startDate: '',
    endDate: '',
    state: 'PLANNED' as 'PLANNED' | 'IN_SESSION' | 'COMPLETED' | 'ARCHIVED',
  })

  const isCurrent = (year: AcademicYear) => {
    const now = new Date()
    return now >= new Date(year.startDate) && now <= new Date(year.endDate)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = editingYear
      ? await updateAcademicYear(editingYear.id, formData)
      : await createAcademicYear(formData)

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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this academic year?')) return

    const result = await deleteAcademicYear(id)
    if (result.success) {
      toast.success('Academic year deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete academic year')
    }
  }

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this academic year?')) return

    const result = await archiveAcademicYear(id)
    if (result.success) {
      toast.success('Academic year archived successfully')
    } else {
      toast.error(result.error || 'Failed to archive academic year')
    }
  }

  const handleEdit = (year: AcademicYear) => {
    setEditingYear(year)
    setFormData({
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
    setFormData({
      name: '',
      code: '',
      startDate: '',
      endDate: '',
      state: 'PLANNED',
    })
  }

  const getStateBadge = (state: string) => {
    const styles = {
      PLANNED: 'bg-blue-50 text-blue-600 hover:bg-blue-50',
      IN_SESSION: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-50',
      COMPLETED: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-100',
      ARCHIVED: 'bg-amber-50 text-amber-600 hover:bg-amber-50',
    }
    return styles[state as keyof typeof styles] || styles.PLANNED
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200">
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">All Academic Years</h2>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Academic Year
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingYear ? 'Edit Academic Year' : 'Add New Academic Year'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Year Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="e.g., Academic Year 2024-2025"
                />
              </div>
              <div>
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  required
                  placeholder="e.g., AY2024-25"
                />
              </div>
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, state: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNED">Planned</SelectItem>
                    <SelectItem value="IN_SESSION">In Session</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
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
                  {editingYear ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-violet-50/50">
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
              <TableCell colSpan={5} className="text-center text-neutral-500 py-8">
                No academic years found. Create your first academic year to get started.
              </TableCell>
            </TableRow>
          ) : (
            academicYears.map((year) => (
              <TableRow key={year.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {year.name}
                    {isCurrent(year) && (
                      <Badge className="bg-violet-50 text-violet-600 hover:bg-violet-50">
                        <Star className="h-3 w-3 mr-1 fill-violet-600" />
                        Current
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{year.code}</TableCell>
                <TableCell>
                  {format(new Date(year.startDate), 'MMM d, yyyy')} -{' '}
                  {format(new Date(year.endDate), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <Badge className={getStateBadge(year.state)}>
                    {year.state.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {year.state !== 'ARCHIVED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchive(year.id)}
                        title="Archive"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(year)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(year.id)}
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
  )
}

