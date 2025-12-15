import { InsightCard } from './InsightCard'
import type { AnomalyInsight } from '../../types/ai'

interface AnomalyCardProps {
  anomaly: AnomalyInsight
}

const severityVariants: Record<string, 'info' | 'warning' | 'alert'> = {
  low: 'info',
  medium: 'warning',
  high: 'alert',
}

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

export function AnomalyCard({ anomaly }: AnomalyCardProps) {
  const variant = severityVariants[anomaly.severity] || 'warning'
  const monthName = monthNames[anomaly.month - 1] || `Month ${anomaly.month}`

  return (
    <InsightCard
      icon="⚠️"
      title={`Anomaly in ${monthName}`}
      variant={variant}
    >
      <p className="font-medium">{anomaly.metric}</p>
      <p className="mt-1">{anomaly.description}</p>
      {anomaly.suggestion && (
        <p className="mt-2 text-xs font-medium text-gray-800">
          💡 {anomaly.suggestion}
        </p>
      )}
    </InsightCard>
  )
}
