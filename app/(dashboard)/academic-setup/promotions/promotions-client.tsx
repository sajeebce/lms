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
    <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-100 rounded-lg">
            <Lock className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <CardTitle className="text-xl">Student Promotion is coming soon 🚧</CardTitle>
            <CardDescription className="text-neutral-700 mt-1">
              You'll be able to move Class 10 (2025) → Class 11 (2026), same branch, with one click.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-white/60 rounded-lg p-4 border border-violet-200">
            <h3 className="font-semibold text-neutral-900 mb-2">What you'll be able to do:</h3>
            <ul className="space-y-2 text-sm text-neutral-700">
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-violet-600" />
                Promote entire cohorts to the next class level
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-violet-600" />
                Maintain student assignments and section structure
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-violet-600" />
                Automatically create new cohorts for the next academic year
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-violet-600" />
                Handle edge cases like graduating students
              </li>
            </ul>
          </div>

          <Button
            onClick={handlePromote}
            className="bg-violet-600 hover:bg-violet-700"
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

