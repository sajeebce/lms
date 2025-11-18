import { getExamBoards } from '@/lib/actions/exam-board.actions'
import { PageHeader } from '@/components/page-header'
import { Layers3 } from 'lucide-react'
import BoardsClient from '../boards/boards-client'

export const metadata = {
  title: 'Institutions (Boards / Colleges / Universities) | Question Bank',
  description:
    'Manage institutions (boards, colleges, universities, publishers) used by your question bank.',
}

export default async function InstitutionsPage() {
  const boards = await getExamBoards()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutions (Boards / Colleges / Universities)"
        description="Manage institutions once and reuse them across question sources and exams."
        icon={Layers3}
        bgColor="bg-sky-50"
        iconBgColor="bg-sky-600"
      />
      <BoardsClient initialBoards={boards} />
    </div>
  )
}

