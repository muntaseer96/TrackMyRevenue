import { InsightCard } from './InsightCard'
import type { ForecastInsight } from '../../types/ai'

interface ForecastCardProps {
  forecast: ForecastInsight
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const confidenceVariants: Record<string, 'success' | 'warning' | 'info'> = {
  high: 'success',
  medium: 'info',
  low: 'warning',
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`
  }
  return `$${amount.toLocaleString()}`
}

export function ForecastCard({ forecast }: ForecastCardProps) {
  const monthName = monthNames[forecast.nextMonth - 1] || `Month ${forecast.nextMonth}`
  const variant = confidenceVariants[forecast.confidence] || 'info'

  return (
    <InsightCard
      icon="🔮"
      title={`${monthName} Forecast`}
      variant={variant}
    >
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Projected Revenue:</span>
          <span className="font-semibold text-green-700">
            {formatCurrency(forecast.projectedRevenue)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Projected Expenses:</span>
          <span className="font-semibold text-red-700">
            {formatCurrency(forecast.projectedExpense)}
          </span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-1">
          <span>Expected Profit:</span>
          <span className="font-bold text-blue-700">
            {formatCurrency(forecast.projectedProfit)}
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-600">
        Confidence: {forecast.confidence} — {forecast.reasoning}
      </p>
    </InsightCard>
  )
}
