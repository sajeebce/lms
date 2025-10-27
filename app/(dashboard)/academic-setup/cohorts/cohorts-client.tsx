'use client'

import { useState, useMemo } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  createCohort,
  updateCohort,
  deleteCohort,
  toggleEnrollmentOpen,
} from './actions'

type Cohort = {
  id: string
  name: string
  status: 'PLANNED' | 'RUNNING' | 'FINISHED' | 'ARCHIVED'
  enrollmentOpen: boolean
  year: { id: string; name: string }
  class: { id: string; name: string }
  branch: { id: string; name: string }
  _count: { sections: number }
}

type Branch = { id: string; name: string }
type AcademicYear = { id: string; name: string }
type Class = { id: string; name: string }

export function CohortsClient({
  cohorts,
  branches,
  academicYears,
  classes,
}: {
  cohorts: Cohort[]
  branches: Branch[]
  academicYears: AcademicYear[]
  classes: Class[]
}) {
  const [open, setOpen] = useState(false)
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    yearId: '',
    classId: '',
    branchId: '',
    status: 'PLANNED' as const,
    enrollmentOpen: false,
  })

  // Filters
  const [filters, setFilters] = useState({
    branchId: '',
    yearId: '',
    classId: '',
    status: '',
    enrollmentOpen: '',
  })

  const filteredCohorts = useMemo(() => {
    return cohorts.filter((cohort) => {
      if (filters.branchId && filters.branchId !== 'all' && cohort.branch.id !== filters.branchId) return false
      if (filters.yearId && filters.yearId !== 'all' && cohort.year.id !== filters.yearId) return false
      if (filters.classId && filters.classId !== 'all' && cohort.class.id !== filters.classId) return false
      if (filters.status && filters.status !== 'all' && cohort.status !== filters.status) return false
      if (filters.enrollmentOpen === 'true' && !cohort.enrollmentOpen) return false
      if (filters.enrollmentOpen === 'false' && cohort.enrollmentOpen) return false
      return true
    })
  }, [cohorts, filters])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = editingCohort
      ? await updateCohort(editingCohort.id, formData)
      : await createCohort(formData)

    if (result.success) {
      toast.success(
        editingCohort ? 'Cohort updated successfully' : 'Cohort created successfully'
      )
      setOpen(false)
      resetForm()
    } else {
      toast.error(result.error || 'An error occurred')
    }
  }

  const handleToggleEnrollment = async (id: string, currentValue: boolean) => {
    const result = await toggleEnrollmentOpen(id, !currentValue)
    if (result.success) {
      toast.success(
        !currentValue ? 'Enrollment opened' : 'Enrollment closed',
        { description: !currentValue ? 'Students can now enroll' : 'Enrollment is now closed' }
      )
    } else {
      toast.error(result.error || 'Failed to toggle enrollment')
    }
  }

  const handleDelete = async (id: string, sectionCount: number) => {
    if (sectionCount > 0) {
      toast.error('Cannot delete', {
        description: `${sectionCount} section(s) linked to this cohort`,
      })
      return
    }

    if (!confirm('Are you sure you want to delete this cohort?')) return

    const result = await deleteCohort(id)
    if (result.success) {
      toast.success('Cohort deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete cohort')
    }
  }

  const handleEdit = (cohort: Cohort) => {
    setEditingCohort(cohort)
    setFormData({
      name: cohort.name,
      yearId: cohort.year.id,
      classId: cohort.class.id,
      branchId: cohort.branch.id,
      status: cohort.status,
      enrollmentOpen: cohort.enrollmentOpen,
    })
    setOpen(true)
  }

  const resetForm = () => {
    setEditingCohort(null)
    setFormData({
      name: '',
      yearId: '',
      classId: '',
      branchId: '',
      status: 'PLANNED',
      enrollmentOpen: false,
    })
  }

  const getStatusBadge = (status: Cohort['status']) => {
    const styles = {
      PLANNED: 'bg-neutral-100 text-neutral-600',
      RUNNING: 'bg-emerald-50 text-emerald-700',
      FINISHED: 'bg-violet-50 text-violet-600',
      ARCHIVED: 'bg-neutral-200 text-neutral-500',
    }
    return (
      <Badge className={`${styles[status]} hover:${styles[status]}`}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label className="text-xs">Branch</Label>
            <Select
              value={filters.branchId}
              onValueChange={(value) =>
                setFilters({ ...filters, branchId: value })
              }
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
              onValueChange={(value) => setFilters({ ...filters, yearId: value })}
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
              onValueChange={(value) =>
                setFilters({ ...filters, classId: value })
              }
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
            <Label className="text-xs">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="PLANNED">PLANNED</SelectItem>
                <SelectItem value="RUNNING">RUNNING</SelectItem>
                <SelectItem value="FINISHED">FINISHED</SelectItem>
                <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Enrollment</Label>
            <Select
              value={filters.enrollmentOpen}
              onValueChange={(value) =>
                setFilters({ ...filters, enrollmentOpen: value })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Open</SelectItem>
                <SelectItem value="false">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-neutral-200">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            All Cohorts ({filteredCohorts.length})
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
                Add Cohort
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCohort ? 'Edit Cohort' : 'Add New Cohort'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Cohort Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="e.g., 2025 Intake, Morning Batch"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Academic Year *</Label>
                    <Select
                      value={formData.yearId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, yearId: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears.map((year) => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Class *</Label>
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
                </div>
                <div>
                  <Label>Branch *</Label>
                  <Select
                    value={formData.branchId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, branchId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, status: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNED">PLANNED</SelectItem>
                      <SelectItem value="RUNNING">RUNNING</SelectItem>
                      <SelectItem value="FINISHED">FINISHED</SelectItem>
                      <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enrollmentOpen">Enrollment Open</Label>
                  <Switch
                    id="enrollmentOpen"
                    checked={formData.enrollmentOpen}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, enrollmentOpen: checked })
                    }
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
                    {editingCohort ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-violet-50/50">
              <TableHead>Cohort Name</TableHead>
              <TableHead>Academic Year</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enrollment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCohorts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-neutral-500 py-8">
                  No cohorts found. Create your first cohort to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredCohorts.map((cohort) => (
                <TableRow key={cohort.id}>
                  <TableCell className="font-medium">{cohort.name}</TableCell>
                  <TableCell>{cohort.year.name}</TableCell>
                  <TableCell>{cohort.class.name}</TableCell>
                  <TableCell>{cohort.branch.name}</TableCell>
                  <TableCell>{getStatusBadge(cohort.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={cohort.enrollmentOpen}
                        onCheckedChange={() =>
                          handleToggleEnrollment(cohort.id, cohort.enrollmentOpen)
                        }
                      />
                      <Badge
                        className={
                          cohort.enrollmentOpen
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-50'
                        }
                      >
                        {cohort.enrollmentOpen ? 'Open' : 'Closed'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(cohort)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDelete(cohort.id, cohort._count.sections)
                        }
                        disabled={cohort._count.sections > 0}
                        title={
                          cohort._count.sections > 0
                            ? `${cohort._count.sections} section(s) linked`
                            : 'Delete cohort'
                        }
                      >
                        {cohort._count.sections > 0 ? (
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
    </div>
  )
}

