import { PageHeader } from '@/components/page-header'
import { Package } from 'lucide-react'

export const metadata = {
  title: 'Questions | Question Bank',
  description: 'Manage questions for topics',
}

export default function QuestionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Questions"
        description="Manage questions for topics"
        icon={Package}
        bgColor="bg-cyan-50"
        iconBgColor="bg-cyan-600"
      />
      
      <div className="bg-card dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700 p-12">
        <div className="text-center space-y-4">
          <div className="text-6xl">🚧</div>
          <h2 className="text-2xl font-bold text-foreground dark:text-slate-200">
            Question Bank Coming Soon
          </h2>
          <p className="text-muted-foreground dark:text-slate-400 max-w-md mx-auto">
            You&apos;ll be able to create and manage questions with multiple choice, true/false, and descriptive types. Questions will be linked to topics for easy organization.
          </p>
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-sm font-medium">
              <Package className="h-4 w-4" />
              <span>Feature in Development</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

