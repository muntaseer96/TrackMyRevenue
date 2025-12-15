import { InsightCard } from './InsightCard'
import type { AIInsights } from '../../types/ai'

interface SummaryCardProps {
  summary: AIInsights['summary']
}

const healthVariants: Record<string, 'success' | 'info' | 'warning' | 'alert'> = {
  excellent: 'success',
  good: 'success',
  fair: 'warning',
  poor: 'alert',
}

const healthLabels: Record<string, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Needs Attention',
}

export function SummaryCard({ summary }: SummaryCardProps) {
  const variant = healthVariants[summary.health] || 'info'
  const healthLabel = healthLabels[summary.health] || summary.health

  return (
    <InsightCard
      icon="🏦"
      title={`Financial Health: ${healthLabel}`}
      variant={variant}
      className="md:col-span-2"
    >
      <p>{summary.description}</p>
      <p className="mt-2 font-semibold text-gray-900">{summary.keyMetric}</p>
    </InsightCard>
  )
}
