'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import { toast } from 'sonner'
import { deleteExamYear } from '@/lib/actions/exam-year.actions'
import YearForm from './year-form'
import { Edit, Trash2, MoreVertical, Search, CalendarDays } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type ExamYear = {
  id: string
  year: number
  label: string | null
  status: string
  _count: { questions: number }
}

type Props = {
  initialYears: ExamYear[]
}

export default function YearsClient({ initialYears }: Props) {
  const [years, setYears] = useState(initialYears)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingYear, setEditingYear] = useState<ExamYear | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [yearToDelete, setYearToDelete] = useState<ExamYear | null>(null)

  const filteredYears = years.filter((year) => {
    const text = `${year.year} ${year.label || ''}`.toLowerCase()
    const matchesSearch = text.includes(searchQuery.toLowerCase())
    const matchesStatus = !filterStatus || year.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleFormSuccess = (newYear: ExamYear) => {
    setYears((prev) => {
      const exists = prev.find((y) => y.id === newYear.id)
      if (exists) {
        return prev.map((y) => (y.id === newYear.id ? newYear : y))
      }
      return [newYear, ...prev]
    })
    setFormOpen(false)
    setEditingYear(null)
  }

  const handleDelete = async () => {
    if (!yearToDelete) return

    const result = await deleteExamYear(yearToDelete.id)

    if (result.success) {
      setYears((prev) => prev.filter((y) => y.id !== yearToDelete.id))
      toast.success('Exam year deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete exam year')
    }

    setDeleteDialogOpen(false)
    setYearToDelete(null)
  }

  const getStatusBadge = (status: string) => (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        status === 'ACTIVE'
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
      }`}
    >
      {status === 'ACTIVE' ? 'Active' : 'Inactive'}
    </span>
  )

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Filters */}
      <div className="bg-card dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search years..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
            />
          </div>
          <SearchableDropdown
            options={[
              { value: '', label: 'All Status' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="All Status"
          />
          <Button
            onClick={() => {
              setEditingYear(null)
              setFormOpen(true)
            }}
            className="w-full md:w-auto bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white whitespace-nowrap"
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Add Exam Year
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden dark:border-slate-700 bg-card dark:bg-slate-900/40">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 dark:bg-slate-800/60">
              <TableHead className="dark:text-slate-300">Year</TableHead>
              <TableHead className="dark:text-slate-300">Label</TableHead>
              <TableHead className="dark:text-slate-300">Questions</TableHead>
              <TableHead className="dark:text-slate-300">Status</TableHead>
              <TableHead className="text-right dark:text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredYears.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground dark:text-slate-400">
                  No exam years found. Create one to start tagging questions.
                </TableCell>
              </TableRow>
            ) : (
              filteredYears.map((year) => (
                <TableRow key={year.id} className="hover:bg-muted/40 dark:hover:bg-slate-800/60">
                  <TableCell className="font-medium">
                    <Badge className="rounded-full px-3 py-1 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {year.year}
                    </Badge>
                  </TableCell>
                  <TableCell>{year.label || '-'}</TableCell>
                  <TableCell>{year._count.questions}</TableCell>
                  <TableCell>{getStatusBadge(year.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingYear(year)
                            setFormOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setYearToDelete(year)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingYear ? 'Edit Exam Year' : 'Add Exam Year'}
            </DialogTitle>
          </DialogHeader>
          <YearForm
            initialData={editingYear}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam Year</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this exam year? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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

