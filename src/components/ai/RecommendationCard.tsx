import { InsightCard } from './InsightCard'
import type { Recommendation } from '../../types/ai'

interface RecommendationCardProps {
  recommendation: Recommendation
}

const priorityVariants: Record<string, 'alert' | 'warning' | 'info'> = {
  high: 'alert',
  medium: 'warning',
  low: 'info',
}

const priorityLabels: Record<string, string> = {
  high: 'High Priority',
  medium: 'Medium Priority',
  low: 'Suggestion',
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const variant = priorityVariants[recommendation.priority] || 'info'
  const priorityLabel = priorityLabels[recommendation.priority] || ''

  return (
    <InsightCard
      icon="💡"
      title={recommendation.title}
      variant={variant}
    >
      {priorityLabel && (
        <span className="mb-1 inline-block rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
          {priorityLabel}
        </span>
      )}
      <p className="mt-1">{recommendation.description}</p>
      <p className="mt-2 font-medium text-gray-900">
        ✓ Action: {recommendation.action}
      </p>
    </InsightCard>
  )
}
