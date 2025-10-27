import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description: string
  icon: LucideIcon
  bgColor?: string
  iconBgColor?: string
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  bgColor = 'bg-violet-50',
  iconBgColor = 'bg-violet-500',
}: PageHeaderProps) {
  return (
    <div className={cn(
      'rounded-xl p-6 border border-neutral-200',
      bgColor
    )}>
      {/* Content */}
      <div className="flex items-center gap-4">
        {/* Icon with shadow */}
        <div className={cn(
          'p-3 rounded-xl shadow-md',
          iconBgColor
        )}>
          <Icon className="h-8 w-8 text-white" />
        </div>

        {/* Text */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
          <p className="text-sm text-neutral-600 mt-1">{description}</p>
        </div>
      </div>
    </div>
  )
}

