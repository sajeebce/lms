import { getTopics } from '@/lib/actions/topic.actions'
import { getChapters } from '@/lib/actions/chapter.actions'
import { getSubjects } from '@/lib/actions/subject.actions'
import { getClasses } from '@/lib/actions/class.actions'
import { PageHeader } from '@/components/page-header'
import { FileText } from 'lucide-react'
import TopicsClient from './topics-client'

export const metadata = {
  title: 'Topics | Question Bank',
  description: 'Manage topics under chapters',
}

export default async function TopicsPage() {
  const topics = await getTopics()
  const chapters = await getChapters()
  const subjects = await getSubjects({ status: 'ACTIVE' })
  const classes = await getClasses()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Topics"
        description="Manage topics under chapters"
        icon={FileText}
        bgColor="bg-indigo-50"
        iconBgColor="bg-indigo-600"
      />
      <TopicsClient
        initialTopics={topics}
        chapters={chapters}
        subjects={subjects}
        classes={classes}
      />
    </div>
  )
}

