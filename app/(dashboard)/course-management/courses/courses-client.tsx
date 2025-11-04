'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Eye, Edit, Trash2, Package, BookOpen } from 'lucide-react'
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
import { toast } from 'sonner'
import { deleteCourse } from './actions'

type Course = {
  id: string
  title: string
  slug: string
  courseType: string
  status: string
  isFeatured: boolean
  category: { id: string; name: string; icon: string | null } | null
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

type Props = {
  courses: Course[]
  categories: Category[]
}

export default function CoursesClient({ courses: initialCourses, categories }: Props) {
  const [courses, setCourses] = useState(initialCourses)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !filterCategory || course.category?.id === filterCategory
    const matchesType = !filterType || course.courseType === filterType
    const matchesStatus = !filterStatus || course.status === filterStatus
    return matchesSearch && matchesCategory && matchesType && matchesStatus
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-orange-500 bg-clip-text text-transparent">
            Courses
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Manage your course catalog
          </p>
        </div>
        <Link href="/course-management/courses/new">
          <Button className="bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </Link>
      </div>

      {/* Filters */}
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

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Courses</p>
          <p className="text-2xl font-bold">{courses.length}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Published</p>
          <p className="text-2xl font-bold text-green-600">
            {courses.filter((c) => c.status === 'PUBLISHED').length}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Drafts</p>
          <p className="text-2xl font-bold text-neutral-600">
            {courses.filter((c) => c.status === 'DRAFT').length}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Enrollments</p>
          <p className="text-2xl font-bold text-violet-600">
            {courses.reduce((sum, c) => sum + c._count.enrollments, 0)}
          </p>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <BookOpen className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">
            {searchQuery || filterCategory || filterType || filterStatus
              ? 'No courses found matching your filters'
              : 'No courses yet. Create your first course to get started!'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="border rounded-lg overflow-hidden hover:shadow-lg transition-all group"
            >
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {course.courseType === 'BUNDLE' ? (
                        <Package className="h-4 w-4 text-orange-600" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-violet-600" />
                      )}
                      {course.isFeatured && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg line-clamp-2">{course.title}</h3>
                  </div>
                  {getStatusBadge(course.status)}
                </div>

                {/* Category */}
                {course.category && (
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    {course.category.icon} {course.category.name}
                  </div>
                )}

                {/* Stats */}
                <div className="flex gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                  <span>{course._count.topics} Topics</span>
                  <span>{course._count.enrollments} Students</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/course-management/courses/${course.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/course-management/courses/${course.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCourseToDelete(course)
                      setDeleteDialogOpen(true)
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{courseToDelete?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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

