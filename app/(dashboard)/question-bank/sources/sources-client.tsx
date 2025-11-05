'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit, Trash2, BookOpen, FileText, BookMarked, User, Calendar, TestTube } from 'lucide-react'
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
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import { toast } from 'sonner'
import { deleteQuestionSource } from '@/lib/actions/question-source.actions'
import SourceForm from './source-form'

type QuestionSource = {
  id: string
  name: string
  type: string
  year: number | null
  description: string | null
  status: string
  _count: {
    questions: number
  }
}

type Props = {
  initialSources: QuestionSource[]
}

const SOURCE_TYPE_ICONS = {
  BOARD_EXAM: BookOpen,
  TEXTBOOK: BookMarked,
  REFERENCE_BOOK: FileText,
  CUSTOM: User,
  PREVIOUS_YEAR: Calendar,
  MOCK_TEST: TestTube,
}

const SOURCE_TYPE_LABELS = {
  BOARD_EXAM: 'Board Exam',
  TEXTBOOK: 'Textbook',
  REFERENCE_BOOK: 'Reference Book',
  CUSTOM: 'Custom',
  PREVIOUS_YEAR: 'Previous Year',
  MOCK_TEST: 'Mock Test',
}

export default function SourcesClient({ initialSources }: Props) {
  const [sources, setSources] = useState(initialSources)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingSource, setEditingSource] = useState<QuestionSource | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sourceToDelete, setSourceToDelete] = useState<QuestionSource | null>(null)

  // Filter sources
  const filteredSources = sources.filter((source) => {
    const matchesSearch = source.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = !filterType || source.type === filterType
    const matchesStatus = !filterStatus || source.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const handleEdit = (source: QuestionSource) => {
    setEditingSource(source)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!sourceToDelete) return

    const result = await deleteQuestionSource(sourceToDelete.id)

    if (result.success) {
      setSources(sources.filter((s) => s.id !== sourceToDelete.id))
      toast.success('Question source deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete question source')
    }

    setDeleteDialogOpen(false)
    setSourceToDelete(null)
  }

  const handleFormSuccess = (newSource: QuestionSource) => {
    if (editingSource) {
      setSources(sources.map((s) => (s.id === newSource.id ? newSource : s)))
    } else {
      setSources([newSource, ...sources])
    }
    setFormOpen(false)
    setEditingSource(null)
  }

  const getTypeBadge = (type: string) => {
    const Icon = SOURCE_TYPE_ICONS[type as keyof typeof SOURCE_TYPE_ICONS] || User
    const label = SOURCE_TYPE_LABELS[type as keyof typeof SOURCE_TYPE_LABELS] || type

    const colors = {
      BOARD_EXAM: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      TEXTBOOK: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      REFERENCE_BOOK: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      CUSTOM: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      PREVIOUS_YEAR: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      MOCK_TEST: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          colors[type as keyof typeof colors] || colors.CUSTOM
        }`}
      >
        <Icon className="h-3 w-3" />
        {label}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === 'ACTIVE'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
        }`}
      >
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <SearchableDropdown
            options={[
              { value: '', label: 'All Types' },
              { value: 'BOARD_EXAM', label: 'Board Exam' },
              { value: 'TEXTBOOK', label: 'Textbook' },
              { value: 'REFERENCE_BOOK', label: 'Reference Book' },
              { value: 'CUSTOM', label: 'Custom' },
              { value: 'PREVIOUS_YEAR', label: 'Previous Year' },
              { value: 'MOCK_TEST', label: 'Mock Test' },
            ]}
            value={filterType}
            onChange={setFilterType}
            placeholder="Filter by type"
          />

          <SearchableDropdown
            options={[
              { value: '', label: 'All Status' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="Filter by status"
          />
        </div>

        <Button
          onClick={() => {
            setEditingSource(null)
            setFormOpen(true)
          }}
          className="bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Source
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-neutral-500">
                  {searchQuery || filterType || filterStatus
                    ? 'No sources found matching your filters'
                    : 'No question sources yet. Add your first source to get started!'}
                </TableCell>
              </TableRow>
            ) : (
              filteredSources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{source.name}</p>
                      {source.description && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">
                          {source.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(source.type)}</TableCell>
                  <TableCell>{source.year || '-'}</TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{source._count.questions}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(source.status)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(source)}>
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSourceToDelete(source)
                          setDeleteDialogOpen(true)
                        }}
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

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSource ? 'Edit Question Source' : 'Add Question Source'}</DialogTitle>
          </DialogHeader>
          <SourceForm
            initialData={editingSource}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setFormOpen(false)
              setEditingSource(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{sourceToDelete?.name}&quot;?
              {sourceToDelete && sourceToDelete._count.questions > 0 && (
                <span className="block mt-2 text-red-600 dark:text-red-400 font-medium">
                  This source is used by {sourceToDelete._count.questions} question(s) and cannot be deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={sourceToDelete ? sourceToDelete._count.questions > 0 : false}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

