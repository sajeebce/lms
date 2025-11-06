'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, BookOpen, FileText, BookMarked, User, Calendar, TestTube, MoreVertical, Database } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
    <div className="space-y-4 md:space-y-6">
      {/* Filters - Responsive Grid */}
      <div className="bg-card dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
            />
          </div>

          {/* Type Filter */}
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
            placeholder="All Types"
          />

          {/* Status Filter */}
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

          {/* Add Button */}
          <Button
            onClick={() => {
              setEditingSource(null)
              setFormOpen(true)
            }}
            className="w-full md:w-auto bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Source</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg overflow-hidden dark:border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 dark:bg-slate-800/50">
              <TableHead className="dark:text-slate-300">Source Name</TableHead>
              <TableHead className="dark:text-slate-300">Type</TableHead>
              <TableHead className="dark:text-slate-300">Year</TableHead>
              <TableHead className="dark:text-slate-300">Questions</TableHead>
              <TableHead className="dark:text-slate-300">Status</TableHead>
              <TableHead className="text-right dark:text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground dark:text-slate-400">
                    {searchQuery || filterType || filterStatus
                      ? 'No sources found matching your filters'
                      : 'No question sources yet. Add your first source to get started!'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSources.map((source) => (
                <TableRow key={source.id} className="dark:border-slate-700">
                  <TableCell>
                    <div>
                      <p className="font-medium dark:text-slate-200">{source.name}</p>
                      {source.description && (
                        <p className="text-sm text-muted-foreground dark:text-slate-400 line-clamp-1">
                          {source.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(source.type)}</TableCell>
                  <TableCell className="dark:text-slate-300">{source.year || '-'}</TableCell>
                  <TableCell>
                    <span className="text-sm font-medium dark:text-slate-300">{source._count.questions}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(source.status)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(source)}>
                        <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSourceToDelete(source)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredSources.length === 0 ? (
          <Card className="p-8 text-center dark:bg-slate-800/50 dark:border-slate-700">
            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground dark:text-slate-400 text-sm">
              {searchQuery || filterType || filterStatus
                ? 'No sources found matching your filters'
                : 'No question sources yet. Add your first source to get started!'}
            </p>
          </Card>
        ) : (
          filteredSources.map((source) => (
            <Card key={source.id} className="p-4 dark:bg-slate-800/50 dark:border-slate-700">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0 mr-2">
                  <h3 className="font-medium text-sm dark:text-slate-200 truncate">{source.name}</h3>
                  {source.description && (
                    <p className="text-xs text-muted-foreground dark:text-slate-400 line-clamp-2 mt-1">
                      {source.description}
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(source)}>
                      <Edit className="h-4 w-4 mr-2 text-blue-600" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSourceToDelete(source)
                        setDeleteDialogOpen(true)
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {getTypeBadge(source.type)}
                {source.year && (
                  <Badge variant="outline" className="dark:border-slate-600 dark:text-slate-300">
                    <Calendar className="h-3 w-3 mr-1" />
                    {source.year}
                  </Badge>
                )}
                <Badge variant="outline" className="dark:border-slate-600 dark:text-slate-300">
                  {source._count.questions} questions
                </Badge>
                {getStatusBadge(source.status)}
              </div>
            </Card>
          ))
        )}
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

