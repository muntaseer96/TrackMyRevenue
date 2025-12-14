import * as React from 'react'
import { cn } from '../../lib/utils'

// Card Root
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-white rounded-lg shadow-sm border border-gray-100',
      className
    )}
    {...props}
  />
))
Card.displayName = 'Card'

// Card Header
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-4 pb-0', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

// Card Title
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold text-gray-900', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

// Card Description
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-500', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

// Card Content
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-4', className)}
    {...props}
  />
))
CardContent.displayName = 'CardContent'

// Card Footer
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-4 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

// KPI Card - specialized card for dashboard metrics
interface KPICardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

const KPICard = React.forwardRef<HTMLDivElement, KPICardProps>(
  ({ className, title, value, subtitle, icon, trend, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-100 p-4',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                'mt-1 text-sm font-medium',
                trend.isPositive ? 'text-primary' : 'text-danger'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 p-2 bg-primary-light rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
)
KPICard.displayName = 'KPICard'

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  KPICard,
}
