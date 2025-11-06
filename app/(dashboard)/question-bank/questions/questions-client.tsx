'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, Package } from 'lucide-react'
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
  const router = useRouter()
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
    <div className="space-y-4 md:space-y-6">
      {/* Filters - Two Row Layout */}
      <div className="bg-card dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700 p-4">
        {/* Row 1: Search + Add Button */}
        <div className="flex gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
            />
          </div>
          <Button
            onClick={() => router.push('/question-bank/questions/new')}
            className="bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Question</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Row 2: Filters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SearchableDropdown
            options={[
              { value: '', label: 'All Subjects' },
              ...subjects.map((s) => ({ value: s.name, label: s.name })),
            ]}
            value={filterSubject}
            onChange={setFilterSubject}
            placeholder="All Subjects"
          />

          <SearchableDropdown
            options={[
              { value: '', label: 'All Classes' },
              ...classes.map((c) => ({ value: c.name, label: c.name })),
            ]}
            value={filterClass}
            onChange={setFilterClass}
            placeholder="All Classes"
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
            placeholder="All Difficulties"
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
            placeholder="All Types"
          />
        </div>
      </div>

      {/* Questions Grid */}
      <div className="grid gap-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 border rounded-lg dark:border-slate-700 bg-card dark:bg-slate-800/30">
            <Package className="h-16 w-16 mx-auto text-muted-foreground dark:text-slate-500 mb-4" />
            <h3 className="text-lg font-medium mb-2 dark:text-slate-200">
              {searchQuery || filterSubject || filterClass || filterDifficulty || filterType
                ? 'No questions found'
                : 'No questions yet'}
            </h3>
            <p className="text-muted-foreground dark:text-slate-400 mb-4">
              {searchQuery || filterSubject || filterClass || filterDifficulty || filterType
                ? 'Try adjusting your filters to find what you\'re looking for'
                : 'Add your first question to get started!'}
            </p>
            {!searchQuery && !filterSubject && !filterClass && !filterDifficulty && !filterType && (
              <Button
                onClick={() => router.push('/question-bank/questions/new')}
                className="bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            )}
          </div>
        ) : (
          filteredQuestions.map((question) => (
            <div
              key={question.id}
              className="border dark:border-slate-700 rounded-lg p-4 md:p-5 hover:shadow-md transition-shadow bg-card dark:bg-slate-800/50"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Question Text */}
                  <p className="text-base font-medium text-foreground dark:text-slate-200 leading-relaxed">
                    {question.questionText}
                  </p>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">
                      📚 {question.topic.chapter.subject.name}
                    </Badge>
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800">
                      🎓 {question.topic.chapter.class.name}
                    </Badge>
                    <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800">
                      📖 {question.topic.chapter.name}
                    </Badge>
                    <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800">
                      📝 {question.topic.name}
                    </Badge>
                    {getTypeBadge(question.questionType)}
                    {getDifficultyBadge(question.difficulty)}
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                      ⭐ {question.marks} marks
                    </Badge>
                  </div>

                  {/* MCQ Options Preview */}
                  {question.questionType === 'MCQ' && question.options && (
                    <div className="space-y-1.5 pl-4 mt-3">
                      {JSON.parse(question.options).map((opt: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          {opt.isCorrect ? (
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-gray-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                          )}
                          <span className={opt.isCorrect ? 'font-medium text-green-700 dark:text-green-400' : 'text-muted-foreground dark:text-slate-400'}>
                            {opt.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2 md:self-start">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(question)}
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQuestionToDelete(question)
                      setDeleteDialogOpen(true)
                    }}
                    className="hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
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

