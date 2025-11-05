import { getQuestionSources } from '@/lib/actions/question-source.actions'
import { PageHeader } from '@/components/page-header'
import { Database } from 'lucide-react'
import SourcesClient from './sources-client'

export const metadata = {
  title: 'Question Sources | Question Bank',
  description: 'Manage question sources (Board Exams, Textbooks, etc.)',
}

export default async function SourcesPage() {
  const sources = await getQuestionSources()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question Sources"
        description="Manage question sources (Board Exams, Textbooks, etc.)"
        icon={Database}
        bgColor="bg-amber-50"
        iconBgColor="bg-amber-600"
      />
      <SourcesClient initialSources={sources} />
    </div>
  )
}

