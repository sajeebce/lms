import { PageHeader } from '@/components/page-header'
import { Package } from 'lucide-react'
import { getQuestions } from '@/lib/actions/question.actions'
import { getSubjects } from '@/lib/actions/subject.actions'
import { getClasses } from '@/lib/actions/class.actions'
import { getChapters } from '@/lib/actions/chapter.actions'
import { getTopics } from '@/lib/actions/topic.actions'
import { getQuestionSources } from '@/lib/actions/question-source.actions'
import QuestionsClient from './questions-client'

export const metadata = {
  title: 'Questions | Question Bank',
  description: 'Manage questions for topics',
}

export default async function QuestionsPage() {
  const [questionsData, subjects, classes, chapters, topics, sources] = await Promise.all([
    getQuestions(),
    getSubjects(),
    getClasses(),
    getChapters(),
    getTopics(),
    getQuestionSources(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Questions"
        description="Manage questions for topics"
        icon={Package}
        bgColor="bg-cyan-50"
        iconBgColor="bg-cyan-600"
      />
      <QuestionsClient
        initialQuestions={questionsData.questions}
        pagination={questionsData.pagination}
        subjects={subjects}
        classes={classes}
        chapters={chapters}
        topics={topics}
        sources={sources}
      />
    </div>
  )
}

