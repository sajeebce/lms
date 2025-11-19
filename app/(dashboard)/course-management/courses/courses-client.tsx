'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Eye, Edit, Trash2, Package, BookOpen, Grid3x3, List, Copy, Rocket } from 'lucide-react'
import Link from 'next/link'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
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
import { toast } from 'sonner'
import { deleteCourse, duplicateCourse, publishCourse } from './actions'

type Course = {
  id: string
  title: string
  slug: string
  courseType: string
  status: string
  isFeatured: boolean
  category: { id: string; name: string; icon: string | null } | null
  class: { id: string; name: string; alias: string | null } | null
  subject: { id: string; name: string; icon: string | null } | null
  stream: { id: string; name: string } | null
  fakeEnrollmentCount: number | null
  _count: {
    enrollments: number
    topics: number
  }
}

type Category = {
  id: string
  name: string
  icon: string | null
}

type Subject = {
  id: string
  name: string
  icon: string | null
}

type Class = {
  id: string
  name: string
  alias: string | null
}

type Stream = {
  id: string
  name: string
}

type Props = {
  courses: Course[]
  categories: Category[]
  subjects: Subject[]
  classes: Class[]
  streams: Stream[]
}

export default function CoursesClient({ courses: initialCourses, categories, subjects, classes, streams }: Props) {
  const router = useRouter()
  const [courses, setCourses] = useState(initialCourses)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterStream, setFilterStream] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [duplicatingCourseId, setDuplicatingCourseId] = useState<string | null>(null)
  const [publishingCourseId, setPublishingCourseId] = useState<string | null>(null)

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !filterCategory || course.category?.id === filterCategory
    const matchesType = !filterType || course.courseType === filterType
    const matchesStatus = !filterStatus || course.status === filterStatus
    const matchesClass = !filterClass || course.class?.id === filterClass
    const matchesSubject = !filterSubject || course.subject?.id === filterSubject
    const matchesStream = !filterStream || course.stream?.id === filterStream
    return matchesSearch && matchesCategory && matchesType && matchesStatus && matchesClass && matchesSubject && matchesStream
  })

  const confirmDelete = async () => {
    if (!courseToDelete) return

    const result = await deleteCourse(courseToDelete.id)
    if (result.success) {
      toast.success('Course deleted successfully')
      setCourses(courses.filter((c) => c.id !== courseToDelete.id))
    } else {
      toast.error(result.error || 'Failed to delete course')
    }
    setDeleteDialogOpen(false)
    setCourseToDelete(null)
  }

  const handleDuplicate = async (course: Course) => {
    setDuplicatingCourseId(course.id)
    try {
      const result = await duplicateCourse(course.id)
      if (result.success) {
        toast.success('Course duplicated as draft')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to duplicate course')
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to duplicate course')
    } finally {
      setDuplicatingCourseId(null)
    }
  }

  const handlePublish = async (course: Course) => {
    if (course.status === 'PUBLISHED') {
      toast.info('Course is already published')
      return
    }

    setPublishingCourseId(course.id)
    try {
      const result = await publishCourse(course.id)
      if (result.success) {
        setCourses((prev) =>
          prev.map((c) => (c.id === course.id ? { ...c, status: 'PUBLISHED' } : c))
        )
        if (result.alreadyPublished) {
          toast.success('Course is already published')
        } else {
          toast.success('Course published successfully')
        }
      } else {
        toast.error(result.error || 'Failed to publish course')
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to publish course')
    } finally {
      setPublishingCourseId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      DRAFT: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
      PUBLISHED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      PRIVATE: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.DRAFT}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700 p-4">
        <div className="space-y-4">
        {/* Row 1: Search, Category, Type, Status */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <SearchableDropdown
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map((cat) => ({
                value: cat.id,
                label: `${cat.icon || '📚'} ${cat.name}`,
              })),
            ]}
            value={filterCategory}
            onChange={setFilterCategory}
            placeholder="Filter by category"
          />

          <SearchableDropdown
            options={[
              { value: '', label: 'All Types' },
              { value: 'SINGLE', label: '📖 Single Course' },
              { value: 'BUNDLE', label: '📦 Bundle' },
            ]}
            value={filterType}
            onChange={setFilterType}
            placeholder="Filter by type"
          />

          <SearchableDropdown
            options={[
              { value: '', label: 'All Status' },
              { value: 'DRAFT', label: '📝 Draft' },
              { value: 'PUBLISHED', label: '✅ Published' },
              { value: 'SCHEDULED', label: '⏰ Scheduled' },
              { value: 'PRIVATE', label: '🔒 Private' },
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="Filter by status"
          />
        </div>

        {/* Row 2: Academic Filters */}
        <div className="grid md:grid-cols-4 gap-4">
          <SearchableDropdown
            options={[
              { value: '', label: 'All Classes' },
              ...classes.map((cls) => ({
                value: cls.id,
                label: `${cls.name}${cls.alias ? ` (${cls.alias})` : ''}`,
              })),
            ]}
            value={filterClass}
            onChange={setFilterClass}
            placeholder="Filter by class"
          />

          <SearchableDropdown
            options={[
              { value: '', label: 'All Subjects' },
              ...subjects.map((subject) => ({
                value: subject.id,
                label: `${subject.icon || '📚'} ${subject.name}`,
              })),
            ]}
            value={filterSubject}
            onChange={setFilterSubject}
            placeholder="Filter by subject"
          />

          <SearchableDropdown
            options={[
              { value: '', label: 'All Streams' },
              ...streams.map((stream) => ({
                value: stream.id,
                label: stream.name,
              })),
            ]}
            value={filterStream}
            onChange={setFilterStream}
            placeholder="Filter by stream"
          />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setFilterCategory('')
                setFilterType('')
                setFilterStatus('')
                setFilterClass('')
                setFilterSubject('')
                setFilterStream('')
              }}
              className="text-xs"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
      </div>

      {/* Stats */}
      <div className="bg-card dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground dark:text-slate-400">Total Courses</p>
            <p className="text-2xl font-bold text-foreground dark:text-slate-200">{courses.length}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground dark:text-slate-400">Published</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {courses.filter((c) => c.status === 'PUBLISHED').length}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground dark:text-slate-400">Drafts</p>
            <p className="text-2xl font-bold text-neutral-600 dark:text-neutral-400">
              {courses.filter((c) => c.status === 'DRAFT').length}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground dark:text-slate-400">Total Enrollments (Displayed)</p>
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              {courses
                .reduce(
                  (sum, c) => sum + (c.fakeEnrollmentCount ?? c._count.enrollments),
                  0,
                )
                .toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div className="bg-card dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700">
        {/* List Header */}
        <div className="flex items-center justify-between p-4 border-b border-border dark:border-slate-700">
          <h2 className="text-lg font-semibold text-foreground dark:text-slate-200">
            All Courses ({filteredCourses.length})
          </h2>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex gap-1 border border-border dark:border-slate-600 rounded-lg p-1 bg-muted/30 dark:bg-slate-800/50">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? undefined : 'text-muted-foreground dark:text-slate-400'}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className={viewMode === 'table' ? undefined : 'text-muted-foreground dark:text-slate-400'}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            {/* Create Course Button */}
            <Link href="/course-management/courses/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </Link>
          </div>
        </div>

        {/* Courses Content */}
        <div className="p-4">
          {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground dark:text-slate-500 mb-4" />
          <p className="text-muted-foreground dark:text-slate-400">
            {searchQuery || filterCategory || filterType || filterStatus
              ? 'No courses found matching your filters'
              : 'No courses yet. Create your first course to get started!'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="border border-border dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-lg dark:hover:shadow-violet-500/10 transition-all group bg-card dark:bg-slate-800/30"
            >
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {course.courseType === 'BUNDLE' ? (
                        <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      )}
                      {course.isFeatured && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 px-2 py-0.5 rounded-full font-medium">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg line-clamp-2 text-foreground dark:text-slate-200">{course.title}</h3>
                  </div>
                  {getStatusBadge(course.status)}
                </div>

                {/* Category */}
                {course.category && (
                  <div className="text-sm text-muted-foreground dark:text-slate-400">
                    {course.category.icon} {course.category.name}
                  </div>
                )}

                {/* Academic Badges */}
                {(course.class || course.subject || course.stream) && (
                  <div className="flex flex-wrap gap-2">
                    {course.class && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-violet-100 to-violet-200 text-violet-700 dark:from-violet-900/40 dark:to-violet-800/40 dark:text-violet-300">
                        🎓 {course.class.name}
                      </span>
                    )}
                    {course.subject && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 dark:from-orange-900/40 dark:to-orange-800/40 dark:text-orange-300">
                        {course.subject.icon || '📚'} {course.subject.name}
                      </span>
                    )}
                    {course.stream && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 dark:from-blue-900/40 dark:to-blue-800/40 dark:text-blue-300">
                        🏛️ {course.stream.name}
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex gap-4 text-sm text-muted-foreground dark:text-slate-400">
                  <span>{course._count.topics.toLocaleString()} Topics</span>
                  <span>{(course.fakeEnrollmentCount ?? course._count.enrollments).toLocaleString()} Students</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/course-management/courses/${course.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/course-management/courses/${course.id}/edit`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  {course.status !== 'PUBLISHED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="dark:border-emerald-500/60 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                      disabled={publishingCourseId === course.id}
                      onClick={() => handlePublish(course)}
                    >
                      <Rocket className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    disabled={duplicatingCourseId === course.id}
                    onClick={() => handleDuplicate(course)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setCourseToDelete(course)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-border dark:border-slate-700 rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50 dark:bg-slate-800/50">
              <TableRow className="hover:bg-transparent dark:hover:bg-transparent border-border dark:border-slate-700">
                <TableHead className="font-semibold text-foreground dark:text-slate-200">Course</TableHead>
                <TableHead className="font-semibold text-foreground dark:text-slate-200">Category</TableHead>
                <TableHead className="font-semibold text-foreground dark:text-slate-200">Academic</TableHead>
                <TableHead className="font-semibold text-foreground dark:text-slate-200">Type</TableHead>
                <TableHead className="font-semibold text-foreground dark:text-slate-200">Status</TableHead>
                <TableHead className="text-center font-semibold text-foreground dark:text-slate-200">Topics</TableHead>
                <TableHead className="text-center font-semibold text-foreground dark:text-slate-200">Students</TableHead>
                <TableHead className="text-right font-semibold text-foreground dark:text-slate-200">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => (
                <TableRow key={course.id} className="border-border dark:border-slate-700 hover:bg-muted/50 dark:hover:bg-slate-800/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {course.courseType === 'BUNDLE' ? (
                        <Package className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-foreground dark:text-slate-200">{course.title}</p>
                        {course.isFeatured && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 px-2 py-0.5 rounded-full font-medium">
                            ⭐ Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {course.category ? (
                      <span className="text-sm text-foreground dark:text-slate-300">
                        {course.category.icon} {course.category.name}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground dark:text-slate-500">No category</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {course.class || course.subject || course.stream ? (
                      <div className="flex flex-wrap gap-1">
                        {course.class && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                            {course.class.name}
                          </span>
                        )}
                        {course.subject && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                            {course.subject.name}
                          </span>
                        )}
                        {course.stream && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            {course.stream.name}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground dark:text-slate-500">Public Course</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground dark:text-slate-300">
                      {course.courseType === 'BUNDLE' ? '📦 Bundle' : '📖 Single'}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(course.status)}</TableCell>
                  <TableCell className="text-center text-foreground dark:text-slate-300">{course._count.topics}</TableCell>
                  <TableCell className="text-center text-foreground dark:text-slate-300">{course._count.enrollments}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Link href={`/course-management/courses/${course.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/course-management/courses/${course.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      {course.status !== 'PUBLISHED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                          disabled={publishingCourseId === course.id}
                          onClick={() => handlePublish(course)}
                        >
                          <Rocket className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="dark:text-slate-300 dark:hover:bg-slate-700"
                        disabled={duplicatingCourseId === course.id}
                        onClick={() => handleDuplicate(course)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setCourseToDelete(course)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-slate-100">Delete Course</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-slate-400">
              Are you sure you want to delete &quot;{courseToDelete?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:border-slate-600">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


