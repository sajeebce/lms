'use client'

import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Clock } from 'lucide-react'
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
import { toast } from 'sonner'
import { createRoutine, updateRoutine, deleteRoutine } from './actions'

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
  const [formData, setFormData] = useState({
    sectionId: '',
    teacherId: '',
    roomId: '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = editingRoutine
      ? await updateRoutine(editingRoutine.id, formData)
      : await createRoutine(formData)

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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this routine?')) return

    const result = await deleteRoutine(id)
    if (result.success) {
      toast.success('Routine deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete routine')
    }
  }

  const handleEdit = (routine: Routine) => {
    setEditingRoutine(routine)
    setFormData({
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
    setFormData({
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
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
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
      <div className="bg-white rounded-lg border border-neutral-200">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="sectionId">Section *</Label>
                  <Select
                    value={formData.sectionId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, sectionId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name} ({section.cohort.class.name} -{' '}
                          {section.cohort.branch.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="teacherId">Teacher *</Label>
                  <Select
                    value={formData.teacherId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, teacherId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="roomId">Room *</Label>
                  <Select
                    value={formData.roomId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, roomId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dayOfWeek">Day of Week *</Label>
                  <Select
                    value={formData.dayOfWeek.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, dayOfWeek: parseInt(value) })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingRoutine ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-violet-50/50">
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
                <TableCell colSpan={6} className="text-center text-neutral-500 py-8">
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
                      <Clock className="h-3 w-3 text-neutral-500" />
                      {routine.startTime} - {routine.endTime}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                      {routine.section.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-violet-50 text-violet-700 hover:bg-violet-50">
                      {routine.teacher.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">
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
                        onClick={() => handleDelete(routine.id)}
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

