'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { deleteTopic } from '@/lib/actions/topic.actions'
import { toast } from 'sonner'
import TopicForm from './topic-form'

type Topic = Awaited<ReturnType<typeof import('@/lib/actions/topic.actions').getTopics>>[number]
type Chapter = Awaited<ReturnType<typeof import('@/lib/actions/chapter.actions').getChapters>>[number]
type Subject = Awaited<ReturnType<typeof import('@/lib/actions/subject.actions').getSubjects>>[number]
type Class = Awaited<ReturnType<typeof import('@/lib/actions/class.actions').getClasses>>[number]

interface TopicsClientProps {
  initialTopics: Topic[]
  chapters: Chapter[]
  subjects: Subject[]
  classes: Class[]
}

export default function TopicsClient({
  initialTopics,
  chapters,
  subjects,
  classes,
}: TopicsClientProps) {
  const [topics, setTopics] = useState<Topic[]>(initialTopics)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterChapter, setFilterChapter] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null)

  // Cascading filter: Get available classes based on selected subject
  const availableClasses = filterSubject
    ? classes.filter((cls) =>
        chapters.some(
          (ch) => ch.subject.id === filterSubject && ch.class.id === cls.id
        )
      )
    : classes

  // Cascading filter: Get available chapters based on selected subject and class
  const availableChapters =
    filterSubject || filterClass
      ? chapters.filter(
          (ch) =>
            (!filterSubject || ch.subject.id === filterSubject) &&
            (!filterClass || ch.class.id === filterClass)
        )
      : chapters

  // Filter topics
  const filteredTopics = topics.filter((topic) => {
    const matchesSearch =
      searchQuery === '' ||
      topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.code?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSubject =
      filterSubject === '' || topic.chapter.subject.id === filterSubject
    const matchesClass =
      filterClass === '' || topic.chapter.class.id === filterClass
    const matchesChapter =
      filterChapter === '' || topic.chapter.id === filterChapter
    const matchesStatus = filterStatus === '' || topic.status === filterStatus

    return (
      matchesSearch &&
      matchesSubject &&
      matchesClass &&
      matchesChapter &&
      matchesStatus
    )
  })

  const handleAddSuccess = (newTopic: Topic) => {
    setTopics([...topics, newTopic])
    setAddDialogOpen(false)
    toast.success('Topic created successfully')
  }

  const handleEditSuccess = (updatedTopic: Topic) => {
    setTopics(
      topics.map((topic) =>
        topic.id === updatedTopic.id ? updatedTopic : topic
      )
    )
    setEditingTopic(null)
    toast.success('Topic updated successfully')
  }

  const handleDelete = async () => {
    if (!topicToDelete) return

    const result = await deleteTopic(topicToDelete.id)

    if (result.success) {
      setTopics(topics.filter((topic) => topic.id !== topicToDelete.id))
      toast.success('Topic deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete topic')
    }

    setDeleteDialogOpen(false)
    setTopicToDelete(null)
  }

  const getStatusBadge = (status: 'ACTIVE' | 'INACTIVE') => {
    if (status === 'ACTIVE') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          ✅ Active
        </span>
      )
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        ⏸️ Inactive
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700 p-4">
        <div className="space-y-4">
          {/* Row 1: Search + Subject + Class */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <SearchableDropdown
              options={subjects.map((subject) => ({
                value: subject.id,
                label: `${subject.icon || ''} ${subject.name}`,
              }))}
              value={filterSubject}
              onChange={(value) => {
                setFilterSubject(value)
                setFilterClass('')
                setFilterChapter('')
              }}
              placeholder="Filter by subject"
            />

            <SearchableDropdown
              options={availableClasses.map((cls) => ({
                value: cls.id,
                label: cls.name,
              }))}
              value={filterClass}
              onChange={(value) => {
                setFilterClass(value)
                setFilterChapter('')
              }}
              placeholder="Filter by class"
            />
          </div>

          {/* Row 2: Chapter + Status + Add Button */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SearchableDropdown
              options={availableChapters.map((chapter) => ({
                value: chapter.id,
                label: `${chapter.name} (${chapter.class.name})`,
              }))}
              value={filterChapter}
              onChange={setFilterChapter}
              placeholder="Filter by chapter"
            />

            <SearchableDropdown
              options={[
                { value: 'ACTIVE', label: '✅ Active' },
                { value: 'INACTIVE', label: '⏸️ Inactive' },
              ]}
              value={filterStatus}
              onChange={setFilterStatus}
              placeholder="Filter by status"
            />

            <Button
              onClick={() => setAddDialogOpen(true)}
              className="bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-700 hover:to-orange-600 text-white font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Topic
            </Button>
          </div>
        </div>
      </div>

      {/* Topics Table */}
      <div className="bg-card dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700">
        <div className="p-4 border-b border-border dark:border-slate-700">
          <h3 className="text-lg font-semibold text-foreground dark:text-slate-200">
            All Topics ({filteredTopics.length})
          </h3>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead>Topic</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Chapter</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTopics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No topics found. Create your first topic to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredTopics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell className="font-medium">{topic.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1">
                      {topic.chapter.subject.icon && (
                        <span>{topic.chapter.subject.icon}</span>
                      )}
                      {topic.chapter.subject.name}
                    </span>
                  </TableCell>
                  <TableCell>{topic.chapter.class.name}</TableCell>
                  <TableCell>{topic.chapter.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {topic.code || '—'}
                  </TableCell>
                  <TableCell>{getStatusBadge(topic.status)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {topic._count.questions}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTopic(topic)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTopicToDelete(topic)
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

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Topic</DialogTitle>
          </DialogHeader>
          <TopicForm
            chapters={chapters}
            subjects={subjects}
            classes={classes}
            onSuccess={handleAddSuccess}
            onCancel={() => setAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTopic} onOpenChange={() => setEditingTopic(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
          </DialogHeader>
          <TopicForm
            topic={editingTopic}
            chapters={chapters}
            subjects={subjects}
            classes={classes}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingTopic(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{topicToDelete?.name}&quot;?
              This action cannot be undone.
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

