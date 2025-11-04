import { BookOpen, Package } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Create Course | LMS',
  description: 'Choose course type',
}

export default function NewCoursePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--theme-active-from)] to-[var(--theme-active-to)] bg-clip-text text-transparent">
          Create New Course
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Choose the type of course you want to create
        </p>
      </div>

      {/* Course Type Cards */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {/* Single Course */}
        <Link href="/course-management/courses/create/single">
          <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-violet-500 group">
            <CardHeader>
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Single Course</CardTitle>
              <CardDescription className="text-base">
                Create a standalone course with topics, lessons, and quizzes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  Multiple topics and lessons
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  7 lesson types (Video, Document, Text, etc.)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  Progress tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  Certificate support
                </li>
              </ul>
            </CardContent>
          </Card>
        </Link>

        {/* Bundle Course */}
        <Link href="/course-management/courses/create/bundle">
          <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-orange-500 group">
            <CardHeader>
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Package className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Bundle Course</CardTitle>
              <CardDescription className="text-base">
                Create a bundle of multiple existing courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Combine multiple courses
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Special bundle pricing
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Flexible enrollment
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Unified progress tracking
                </li>
              </ul>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

