import { PromotionsClient } from './promotions-client'

export default function PromotionsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg p-6 border border-violet-100">
        <h1 className="text-2xl font-bold text-neutral-900">Student Promotions</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Promote students to the next academic year
        </p>
      </div>
      <PromotionsClient />
    </div>
  )
}

