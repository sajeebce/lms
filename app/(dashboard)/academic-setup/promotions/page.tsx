import { PromotionsClient } from './promotions-client'
import { PageHeader } from '@/components/page-header'
import { ArrowRight } from 'lucide-react'

export default function PromotionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Promotions"
        description="Promote students from one cohort to another"
        icon={ArrowRight}
        bgColor="bg-rose-50"
        iconBgColor="bg-gradient-to-br from-red-500 to-orange-500"
      />
      <PromotionsClient />
    </div>
  )
}

