import { getChapters } from '@/lib/actions/chapter.actions'
import { getSubjects } from '@/lib/actions/subject.actions'
import { getClasses } from '@/lib/actions/class.actions'
import { PageHeader } from '@/components/page-header'
import { BookOpen } from 'lucide-react'
import ChaptersClient from './chapters-client'

export const metadata = {
  title: 'Chapters | Academic Setup',
  description: 'Manage chapters for subjects across classes',
}

export default async function ChaptersPage() {
  const chapters = await getChapters()
  const subjects = await getSubjects({ status: 'ACTIVE' })
  const classes = await getClasses()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chapters"
        description="Manage chapters for subjects across classes"
        icon={BookOpen}
        bgColor="bg-purple-50"
        iconBgColor="bg-purple-600"
      />
      <ChaptersClient
        initialChapters={chapters}
        subjects={subjects}
        classes={classes}
      />
    </div>
  )
}

