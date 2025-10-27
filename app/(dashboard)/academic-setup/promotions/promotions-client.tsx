'use client'

import { Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export function PromotionsClient() {
  const handlePromote = async () => {
    // Return 501 Not Implemented
    toast.error('Not implemented yet', {
      description: 'Student promotion feature is coming soon',
    })
  }

  return (
    <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 border-violet-200 dark:border-violet-800/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
            <Lock className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <CardTitle className="text-xl">Student Promotion is coming soon 🚧</CardTitle>
            <CardDescription className="text-neutral-700 dark:text-neutral-300 mt-1">
              You'll be able to move Class 10 (2025) → Class 11 (2026), same branch, with one click.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-white/60 dark:bg-white/5 rounded-lg p-4 border border-violet-200 dark:border-violet-800/30">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">What you'll be able to do:</h3>
            <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                Promote entire cohorts to the next class level
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                Maintain student assignments and section structure
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                Automatically create new cohorts for the next academic year
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                Handle edge cases like graduating students
              </li>
            </ul>
          </div>

          <Button
            onClick={handlePromote}
            disabled
          >
            <Lock className="h-4 w-4 mr-2" />
            Promote Now (Coming Soon)
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

