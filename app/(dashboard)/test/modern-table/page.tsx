import { ModernTableClient } from './modern-table-client'
import { PageHeader } from '@/components/page-header'
import { Table2 } from 'lucide-react'

export default function ModernTablePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Modern Data Table"
        description="Full-featured reusable table component with filtering, sorting, pagination, and export"
        icon={Table2}
        bgColor="bg-indigo-50"
        iconBgColor="bg-indigo-600"
      />
      <ModernTableClient />
    </div>
  )
}

