import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface InsightCardProps {
  icon: string
  title: string
  children: ReactNode
  variant?: 'info' | 'success' | 'warning' | 'alert'
  className?: string
}

const variantStyles = {
  info: 'border-blue-200 bg-blue-50',
  success: 'border-green-200 bg-green-50',
  warning: 'border-yellow-200 bg-yellow-50',
  alert: 'border-red-200 bg-red-50',
}

const iconBgStyles = {
  info: 'bg-blue-100 text-blue-600',
  success: 'bg-green-100 text-green-600',
  warning: 'bg-yellow-100 text-yellow-600',
  alert: 'bg-red-100 text-red-600',
}

export function InsightCard({
  icon,
  title,
  children,
  variant = 'info',
  className,
}: InsightCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4 shadow-sm',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xl',
            iconBgStyles[variant]
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <div className="mt-1 text-sm text-gray-700">{children}</div>
        </div>
      </div>
    </div>
  )
}
