import { getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Edit, BookOpen, Users, Calendar } from 'lucide-react'

export const metadata = {
  title: 'Course Details | LMS',
  description: 'View course details',
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function CourseDetailsPage({ params }: Props) {
  const { id } = await params
  const tenantId = await getTenantId()

  const course = await prisma.course.findFirst({
    where: { id, tenantId },
    include: {
      category: true,
      faqs: {
        orderBy: { order: 'asc' },
      },
      _count: {
        select: {
          enrollments: true,
          topics: true,
        },
      },
    },
  })

  if (!course) {
    notFound()
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      DRAFT: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
      PUBLISHED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      PRIVATE: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles] || styles.DRAFT}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/course-management/courses">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              {course.title}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Course Details
            </p>
          </div>

          <Link href={`/course-management/courses/${course.id}/edit`}>
            <Button className="bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white">
              <Edit className="h-4 w-4 mr-2" />
              Edit Course
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-violet-100 dark:bg-violet-900">
                <BookOpen className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Topics</p>
                <p className="text-2xl font-bold">{course._count.topics}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Students</p>
                <p className="text-2xl font-bold">{course._count.enrollments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900">
                <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Status</p>
                <div className="mt-1">{getStatusBadge(course.status)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Category</p>
              <p className="font-medium">
                {course.category ? `${course.category.icon || '📚'} ${course.category.name}` : 'No category'}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Slug</p>
              <p className="font-medium font-mono text-sm">{course.slug}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Short Description</p>
              <p className="text-sm">{course.shortDescription || 'No description'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Payment Type</p>
              <p className="font-medium">{course.paymentType}</p>
            </div>
            {course.paymentType !== 'FREE' && (
              <>
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Regular Price</p>
                  <p className="font-medium">{course.currency} {course.regularPrice || 0}</p>
                </div>
                {course.offerPrice && (
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Offer Price</p>
                    <p className="font-medium text-green-600">{course.currency} {course.offerPrice}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {course.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
              {course.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* FAQs */}
      {course.faqs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {course.faqs.map((faq, index) => (
              <div key={faq.id} className="border-b last:border-0 pb-4 last:pb-0">
                <p className="font-medium mb-2">
                  {index + 1}. {faq.question}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {faq.answer}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

