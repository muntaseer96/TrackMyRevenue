import { InsightCard } from './InsightCard'
import type { TrendInsight } from '../../types/ai'

interface TrendCardProps {
  trend: TrendInsight
}

const trendIcons: Record<string, string> = {
  growth: '📈',
  decline: '📉',
  stable: '➡️',
}

const trendVariants: Record<string, 'success' | 'warning' | 'info'> = {
  growth: 'success',
  decline: 'warning',
  stable: 'info',
}

export function TrendCard({ trend }: TrendCardProps) {
  const icon = trendIcons[trend.type] || '📊'
  const variant = trendVariants[trend.type] || 'info'

  const changePrefix = trend.percentChange >= 0 ? '+' : ''
  const changeText = `${changePrefix}${trend.percentChange.toFixed(1)}%`

  return (
    <InsightCard
      icon={icon}
      title={`${trend.metric} Trend`}
      variant={variant}
    >
      <p>{trend.description}</p>
      {trend.details && (
        <p className="mt-1 text-xs text-gray-600">{trend.details}</p>
      )}
      <p className="mt-2 font-semibold">
        {trend.type === 'growth' ? '▲' : trend.type === 'decline' ? '▼' : '—'} {changeText}
      </p>
    </InsightCard>
  )
}
