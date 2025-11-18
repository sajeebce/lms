import { PageHeader } from '@/components/page-header'
import { CalendarDays } from 'lucide-react'
import { getExamYears } from '@/lib/actions/exam-year.actions'
import YearsClient from './years-client'

export const metadata = {
  title: 'Exam Years | Question Bank',
  description: 'Manage exam years used when tagging questions',
}

export default async function YearsPage() {
  const years = await getExamYears()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam Years"
        description="Create and manage exam years so you can tag questions like Adamjee 2023 or Dhaka Board 2024."
        icon={CalendarDays}
        bgColor="bg-emerald-50"
        iconBgColor="bg-emerald-600"
      />
      <YearsClient initialYears={years} />
    </div>
  )
}

