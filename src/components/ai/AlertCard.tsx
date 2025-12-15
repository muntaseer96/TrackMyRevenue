import { InsightCard } from './InsightCard'
import type { AlertInsight } from '../../types/ai'

interface AlertCardProps {
  alert: AlertInsight
}

const severityVariants: Record<string, 'warning' | 'alert'> = {
  warning: 'warning',
  critical: 'alert',
}

const severityIcons: Record<string, string> = {
  warning: '⚡',
  critical: '🚨',
}

export function AlertCard({ alert }: AlertCardProps) {
  const variant = severityVariants[alert.severity] || 'warning'
  const icon = severityIcons[alert.severity] || '⚠️'

  return (
    <InsightCard
      icon={icon}
      title={alert.title}
      variant={variant}
    >
      <p>{alert.description}</p>
      {alert.action && (
        <p className="mt-2 font-medium text-gray-900">
          ✓ Recommended: {alert.action}
        </p>
      )}
    </InsightCard>
  )
}
