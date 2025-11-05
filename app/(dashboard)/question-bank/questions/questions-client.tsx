'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { deleteQuestion } from '@/lib/actions/question.actions'
import QuestionForm from './question-form'
import { Check, X } from 'lucide-react'

type Question = {
  id: string
  questionText: string
  questionType: string
  difficulty: string
  marks: number
  options: string | null
  correctAnswer: string | null
  topic: {
    name: string
    chapter: {
      name: string
      subject: { name: string }
      class: { name: string }
    }
  }
  source: { name: string } | null
}

type Props = {
  initialQuestions: Question[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  subjects: any[]
  classes: any[]
  chapters: any[]
  topics: any[]
  sources: any[]
}

const DIFFICULTY_COLORS = {
  EASY: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HARD: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  EXPERT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const TYPE_LABELS = {
  MCQ: '📝 MCQ',
  TRUE_FALSE: '✓✗ True/False',
  SHORT_ANSWER: '📄 Short Answer',
  LONG_ANSWER: '📋 Long Answer',
  FILL_BLANK: '⬜ Fill Blank',
  MATCHING: '🔗 Matching',
}

export default function QuestionsClient({
  initialQuestions,
  pagination,
  subjects,
  classes,
  chapters,
  topics,
  sources,
}: Props) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterChapter, setFilterChapter] = useState('')
  const [filterTopic, setFilterTopic] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('')
  const [filterType, setFilterType] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null)

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.questionText.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSubject = !filterSubject || q.topic.chapter.subject.name === filterSubject
    const matchesClass = !filterClass || q.topic.chapter.class.name === filterClass
    const matchesChapter = !filterChapter || q.topic.chapter.name === filterChapter
    const matchesTopic = !filterTopic || q.topic.name === filterTopic
    const matchesDifficulty = !filterDifficulty || q.difficulty === filterDifficulty
    const matchesType = !filterType || q.questionType === filterType

    return (
      matchesSearch &&
      matchesSubject &&
      matchesClass &&
      matchesChapter &&
      matchesTopic &&
      matchesDifficulty &&
      matchesType
    )
  })

  const handleEdit = (question: Question) => {
    setEditingQuestion(question)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!questionToDelete) return

    const result = await deleteQuestion(questionToDelete.id)

    if (result.success) {
      setQuestions(questions.filter((q) => q.id !== questionToDelete.id))
      toast.success('Question deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete question')
    }

    setDeleteDialogOpen(false)
    setQuestionToDelete(null)
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setEditingQuestion(null)
    window.location.reload()
  }

  const getDifficultyBadge = (difficulty: string) => {
    const emoji = { EASY: '🟢', MEDIUM: '🟡', HARD: '🟠', EXPERT: '🔴' }[difficulty] || '⚪'
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          DIFFICULTY_COLORS[difficulty as keyof typeof DIFFICULTY_COLORS] || 'bg-gray-100 text-gray-700'
        }`}
      >
        {emoji} {difficulty}
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        {TYPE_LABELS[type as keyof typeof TYPE_LABELS] || type}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <SearchableDropdown
            options={[
              { value: '', label: 'All Subjects' },
              ...subjects.map((s) => ({ value: s.name, label: s.name })),
            ]}
            value={filterSubject}
            onChange={setFilterSubject}
            placeholder="Subject"
          />

          <SearchableDropdown
            options={[
              { value: '', label: 'All Classes' },
              ...classes.map((c) => ({ value: c.name, label: c.name })),
            ]}
            value={filterClass}
            onChange={setFilterClass}
            placeholder="Class"
          />

          <SearchableDropdown
            options={[
              { value: '', label: 'All Difficulties' },
              { value: 'EASY', label: '🟢 Easy' },
              { value: 'MEDIUM', label: '🟡 Medium' },
              { value: 'HARD', label: '🟠 Hard' },
              { value: 'EXPERT', label: '🔴 Expert' },
            ]}
            value={filterDifficulty}
            onChange={setFilterDifficulty}
            placeholder="Difficulty"
          />

          <SearchableDropdown
            options={[
              { value: '', label: 'All Types' },
              { value: 'MCQ', label: '📝 MCQ' },
              { value: 'TRUE_FALSE', label: '✓✗ True/False' },
              { value: 'SHORT_ANSWER', label: '📄 Short Answer' },
              { value: 'LONG_ANSWER', label: '📋 Long Answer' },
            ]}
            value={filterType}
            onChange={setFilterType}
            placeholder="Type"
          />
        </div>

        <Button
          onClick={() => {
            setEditingQuestion(null)
            setFormOpen(true)
          }}
          className="bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Questions Grid */}
      <div className="grid gap-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 border rounded-lg">
            {searchQuery || filterSubject || filterClass || filterDifficulty || filterType
              ? 'No questions found matching your filters'
              : 'No questions yet. Add your first question to get started!'}
          </div>
        ) : (
          filteredQuestions.map((question) => (
            <div
              key={question.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Question Text */}
                  <p className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                    {question.questionText}
                  </p>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      {question.topic.chapter.subject.name}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {question.topic.chapter.class.name}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                      {question.topic.chapter.name}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                      {question.topic.name}
                    </span>
                    {getTypeBadge(question.questionType)}
                    {getDifficultyBadge(question.difficulty)}
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {question.marks} marks
                    </span>
                  </div>

                  {/* MCQ Options Preview */}
                  {question.questionType === 'MCQ' && question.options && (
                    <div className="space-y-1 pl-4">
                      {JSON.parse(question.options).map((opt: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          {opt.isCorrect ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-gray-400" />
                          )}
                          <span className={opt.isCorrect ? 'font-medium text-green-700 dark:text-green-400' : 'text-neutral-600 dark:text-neutral-400'}>
                            {opt.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(question)}>
                    <Edit className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQuestionToDelete(question)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle>
          </DialogHeader>
          <QuestionForm
            subjects={subjects}
            classes={classes}
            chapters={chapters}
            topics={topics}
            sources={sources}
            initialData={editingQuestion}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setFormOpen(false)
              setEditingQuestion(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

