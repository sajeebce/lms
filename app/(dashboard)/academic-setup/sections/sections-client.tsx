'use client'

import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
import { createSection, updateSection, deleteSection } from './actions'

type Section = {
  id: string
  name: string
  capacity: number
  note: string | null
  cohort: {
    id: string
    name: string
    year: { id: string; name: string }
    class: { id: string; name: string }
    branch: { id: string; name: string }
  }
}

type Branch = { id: string; name: string }
type AcademicYear = { id: string; name: string }
type Class = { id: string; name: string }
type Cohort = {
  id: string
  name: string
  year: { id: string; name: string }
  class: { id: string; name: string }
  branch: { id: string; name: string }
}

export function SectionsClient({
  sections,
  branches,
  academicYears,
  classes,
  cohorts,
}: {
  sections: Section[]
  branches: Branch[]
  academicYears: AcademicYear[]
  classes: Class[]
  cohorts: Cohort[]
}) {
  const [open, setOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    cohortId: '',
    capacity: 40,
    note: '',
  })

  // Filters
  const [filters, setFilters] = useState({
    branchId: '',
    yearId: '',
    classId: '',
    cohortId: '',
  })

  // Cascading filter logic
  const filteredCohorts = useMemo(() => {
    return cohorts.filter((cohort) => {
      if (filters.branchId && filters.branchId !== 'all' && cohort.branch.id !== filters.branchId) return false
      if (filters.yearId && filters.yearId !== 'all' && cohort.year.id !== filters.yearId) return false
      if (filters.classId && filters.classId !== 'all' && cohort.class.id !== filters.classId) return false
      return true
    })
  }, [cohorts, filters])

  const filteredSections = useMemo(() => {
    return sections.filter((section) => {
      if (filters.branchId && filters.branchId !== 'all' && section.cohort.branch.id !== filters.branchId)
        return false
      if (filters.yearId && filters.yearId !== 'all' && section.cohort.year.id !== filters.yearId) return false
      if (filters.classId && filters.classId !== 'all' && section.cohort.class.id !== filters.classId) return false
      if (filters.cohortId && filters.cohortId !== 'all' && section.cohort.id !== filters.cohortId) return false
      return true
    })
  }, [sections, filters])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = editingSection
      ? await updateSection(editingSection.id, {
          ...formData,
          note: formData.note || undefined,
        })
      : await createSection({
          ...formData,
          note: formData.note || undefined,
        })

    if (result.success) {
      toast.success(
        editingSection
          ? 'Section updated successfully'
          : 'Section created successfully'
      )
      setOpen(false)
      resetForm()
    } else {
      toast.error(result.error || 'An error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return

    const result = await deleteSection(id)
    if (result.success) {
      toast.success('Section deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete section')
    }
  }

  const handleEdit = (section: Section) => {
    setEditingSection(section)
    setFormData({
      name: section.name,
      cohortId: section.cohort.id,
      capacity: section.capacity,
      note: section.note || '',
    })
    setOpen(true)
  }

  const resetForm = () => {
    setEditingSection(null)
    setFormData({
      name: '',
      cohortId: '',
      capacity: 40,
      note: '',
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs">Branch</Label>
            <Select
              value={filters.branchId}
              onValueChange={(value) => {
                setFilters({ ...filters, branchId: value, cohortId: '' })
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
            <Label className="text-xs">Academic Year</Label>
            <Select
              value={filters.yearId}
              onValueChange={(value) => {
                setFilters({ ...filters, yearId: value, cohortId: '' })
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Class</Label>
            <Select
              value={filters.classId}
              onValueChange={(value) => {
                setFilters({ ...filters, classId: value, cohortId: '' })
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Cohort</Label>
            <Select
              value={filters.cohortId}
              onValueChange={(value) => setFilters({ ...filters, cohortId: value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {filteredCohorts.map((cohort) => (
                  <SelectItem key={cohort.id} value={cohort.id}>
                    {cohort.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-neutral-200">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            All Sections ({filteredSections.length})
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
                Add Section
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSection ? 'Edit Section' : 'Add New Section'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="cohortId">Cohort *</Label>
                  <Select
                    value={formData.cohortId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, cohortId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cohort" />
                    </SelectTrigger>
                    <SelectContent>
                      {cohorts.map((cohort) => (
                        <SelectItem key={cohort.id} value={cohort.id}>
                          {cohort.name} ({cohort.class.name} - {cohort.branch.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">Section Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="e.g., Section A, Morning Batch"
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
                    {editingSection ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-violet-50/50">
              <TableHead>Section Name</TableHead>
              <TableHead>Cohort</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-neutral-500 py-8">
                  No sections found. Create your first section to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredSections.map((section) => (
                <TableRow key={section.id}>
                  <TableCell className="font-medium">{section.name}</TableCell>
                  <TableCell>
                    <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
                      {section.cohort.name}
                    </Badge>
                  </TableCell>
                  <TableCell>{section.cohort.class.name}</TableCell>
                  <TableCell>{section.cohort.branch.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{section.capacity} students</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(section)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(section.id)}
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

