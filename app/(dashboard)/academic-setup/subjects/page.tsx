import { getSubjects } from '@/lib/actions/subject.actions'
import SubjectsClient from './subjects-client'
import { PageHeader } from '@/components/page-header'
import { BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Subject Management | LMS',
  description: 'Manage subjects across all classes',
}

export default async function SubjectsPage() {
  const subjects = await getSubjects()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        description="Manage subjects across all classes"
        icon={BookOpen}
        bgColor="bg-purple-50"
        iconBgColor="bg-purple-600"
      />
      <SubjectsClient initialSubjects={subjects} />
    </div>
  )
}

