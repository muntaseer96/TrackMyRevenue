import { InsightCard } from './InsightCard'
import type { PerformerInsight } from '../../types/ai'

interface PerformerCardProps {
  performer: PerformerInsight
}

function formatValue(value: number, metric: string): string {
  // If it looks like currency, format accordingly
  if (metric.toLowerCase().includes('revenue') ||
      metric.toLowerCase().includes('profit') ||
      metric.toLowerCase().includes('amount')) {
    if (value >= 100000) {
      return `৳${(value / 100000).toFixed(2)}L`
    }
    return `৳${value.toLocaleString()}`
  }
  // If it looks like a percentage
  if (metric.toLowerCase().includes('margin') ||
      metric.toLowerCase().includes('rate') ||
      metric.toLowerCase().includes('%')) {
    return `${value.toFixed(1)}%`
  }
  // Default formatting
  return value.toLocaleString()
}

export function PerformerCard({ performer }: PerformerCardProps) {
  const typeIcon = performer.type === 'website' ? '🌐' : '📁'
  const typeLabel = performer.type === 'website' ? 'Top Website' : 'Top Category'

  return (
    <InsightCard
      icon={typeIcon}
      title={typeLabel}
      variant="success"
    >
      <p className="font-semibold text-gray-900">{performer.name}</p>
      <p className="mt-1">
        {performer.metric}: <span className="font-bold">{formatValue(performer.value, performer.metric)}</span>
      </p>
      <p className="mt-1 text-xs text-gray-600">{performer.reason}</p>
    </InsightCard>
  )
}
