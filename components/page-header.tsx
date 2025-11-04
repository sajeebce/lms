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
  // Map light background colors to dark mode variants
  const getDarkBgClass = () => {
    if (bgColor.includes('violet')) return 'dark:bg-violet-950/20'
    if (bgColor.includes('emerald')) return 'dark:bg-emerald-950/20'
    if (bgColor.includes('amber')) return 'dark:bg-amber-950/20'
    if (bgColor.includes('blue')) return 'dark:bg-blue-950/20'
    if (bgColor.includes('pink')) return 'dark:bg-pink-950/20'
    if (bgColor.includes('cyan')) return 'dark:bg-cyan-950/20'
    if (bgColor.includes('rose')) return 'dark:bg-rose-950/20'
    if (bgColor.includes('indigo')) return 'dark:bg-indigo-950/20'
    if (bgColor.includes('teal')) return 'dark:bg-teal-950/20'
    if (bgColor.includes('lime')) return 'dark:bg-lime-950/20'
    if (bgColor.includes('orange')) return 'dark:bg-orange-950/20'
    if (bgColor.includes('purple')) return 'dark:bg-purple-950/20'
    return 'dark:bg-violet-950/20' // fallback
  }

  return (
    <div className={cn(
      'rounded-xl p-6 border border-border flex-1 min-w-0',
      bgColor,
      getDarkBgClass()
    )}>
      {/* Content */}
      <div className="flex items-center gap-4">
        {/* Icon with shadow - Fixed size to prevent shift */}
        <div className={cn(
          'p-3 rounded-xl shadow-md flex-shrink-0',
          iconBgColor
        )}>
          <Icon className="h-8 w-8 text-white" />
        </div>

        {/* Text - Truncate if needed */}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-card-foreground truncate">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1 truncate">{description}</p>
        </div>
      </div>
    </div>
  )
}

