import { useState } from 'react'
import { useAIInsights } from '../../hooks/useAIInsights'
import { TrendCard } from './TrendCard'
import { AnomalyCard } from './AnomalyCard'
import { RecommendationCard } from './RecommendationCard'
import { ForecastCard } from './ForecastCard'
import { PerformerCard } from './PerformerCard'
import { AlertCard } from './AlertCard'
import { AIChatInput } from './AIChatInput'
import type { AIInsights } from '../../types/ai'

// Check if there are urgent issues that need attention
function hasUrgentInsights(insights: AIInsights): boolean {
  if (insights.alerts.length > 0) return true
  if (insights.anomalies.length > 0) return true
  if (insights.summary.health === 'poor' || insights.summary.health === 'fair') return true
  if (insights.recommendations.some(r => r.priority === 'high')) return true
  if (insights.trends.some(t => Math.abs(t.percentChange) > 20 || t.type === 'decline')) return true
  return false
}

// Get urgent items
function getUrgentItems(insights: AIInsights) {
  return {
    alerts: insights.alerts,
    anomalies: insights.anomalies,
    recommendations: insights.recommendations.filter(r => r.priority === 'high'),
    trends: insights.trends.filter(t => Math.abs(t.percentChange) > 20 || t.type === 'decline'),
    healthWarning: insights.summary.health === 'poor' || insights.summary.health === 'fair'
      ? insights.summary
      : null,
  }
}

function formatCurrency(amount: number): string {
  if (amount >= 100000) {
    return `৳${(amount / 100000).toFixed(1)}L`
  }
  return `৳${amount.toLocaleString()}`
}

export function AIInsightsSection() {
  const { insights, isLoading, error, hasApiKey, refresh } = useAIInsights()
  const [alertsExpanded, setAlertsExpanded] = useState(false)
  const [infoExpanded, setInfoExpanded] = useState(false)

  // Don't show anything if no API key
  if (!hasApiKey) {
    return null
  }

  // Show minimal loading indicator
  if (isLoading && !insights) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <span className="animate-spin">🤖</span>
          <span>AI is analyzing your finances...</span>
        </div>
        <AIChatInput />
      </div>
    )
  }

  // Don't show errors prominently
  if (error && !insights) {
    return <AIChatInput />
  }

  if (!insights) {
    return <AIChatInput />
  }

  const hasUrgent = hasUrgentInsights(insights)
  const urgent = getUrgentItems(insights)
  const urgentCount = urgent.alerts.length +
                      urgent.anomalies.length +
                      urgent.recommendations.length +
                      urgent.trends.length +
                      (urgent.healthWarning ? 1 : 0)

  // Get forecast and top performers for the info section
  const topPerformer = insights.topPerformers[0]
  const forecast = insights.forecast

  return (
    <div className="space-y-3">
      {/* Urgent Alerts Section - only if there are issues */}
      {hasUrgent && (
        <div>
          <div
            className="flex items-center justify-between rounded-t-lg border border-amber-200 bg-amber-50 px-4 py-3 cursor-pointer hover:bg-amber-100 transition-colors"
            onClick={() => setAlertsExpanded(!alertsExpanded)}
          >
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <span>⚠️</span>
              <span className="font-medium">
                {urgentCount} {urgentCount === 1 ? 'issue needs' : 'issues need'} your attention
              </span>
              {urgent.alerts.some(a => a.severity === 'critical') && (
                <span className="rounded bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
                  URGENT
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  refresh()
                }}
                disabled={isLoading}
                className="text-xs text-amber-600 hover:text-amber-800 disabled:opacity-50"
              >
                {isLoading ? '↻...' : '↻'}
              </button>
              <span className="text-amber-600">{alertsExpanded ? '▲' : '▼'}</span>
            </div>
          </div>

          {alertsExpanded && (
            <div className="rounded-b-lg border border-t-0 border-amber-200 bg-white p-4">
              <div className="grid gap-4 md:grid-cols-2">
                {urgent.healthWarning && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 md:col-span-2">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <h3 className="font-semibold text-red-900">
                          Financial Health: {urgent.healthWarning.health === 'poor' ? 'Needs Attention' : 'Fair'}
                        </h3>
                        <p className="mt-1 text-sm text-red-700">{urgent.healthWarning.description}</p>
                      </div>
                    </div>
                  </div>
                )}
                {urgent.alerts.map((alert, i) => (
                  <AlertCard key={`alert-${i}`} alert={alert} />
                ))}
                {urgent.anomalies.map((anomaly, i) => (
                  <AnomalyCard key={`anomaly-${i}`} anomaly={anomaly} />
                ))}
                {urgent.trends.map((trend, i) => (
                  <TrendCard key={`trend-${i}`} trend={trend} />
                ))}
                {urgent.recommendations.map((rec, i) => (
                  <RecommendationCard key={`rec-${i}`} recommendation={rec} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Forecast & Top Performer - always visible but minimal */}
      <div>
        <div
          className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => setInfoExpanded(!infoExpanded)}
          style={infoExpanded ? { borderRadius: '0.5rem 0.5rem 0 0' } : {}}
        >
          <div className="flex items-center gap-4 text-sm">
            {/* Forecast preview */}
            <div className="flex items-center gap-2 text-blue-800">
              <span>🔮</span>
              <span>
                Next month: <span className="font-semibold">{formatCurrency(forecast.projectedProfit)}</span> profit
              </span>
            </div>

            {/* Top performer preview */}
            {topPerformer && (
              <>
                <span className="text-blue-300">|</span>
                <div className="flex items-center gap-2 text-blue-800">
                  <span>🏆</span>
                  <span>
                    Top: <span className="font-semibold">{topPerformer.name}</span>
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!hasUrgent && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  refresh()
                }}
                disabled={isLoading}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {isLoading ? '↻...' : '↻'}
              </button>
            )}
            <span className="text-blue-400">{infoExpanded ? '▲' : '▼'}</span>
          </div>
        </div>

        {infoExpanded && (
          <div className="rounded-b-lg border border-t-0 border-blue-100 bg-white p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <ForecastCard forecast={forecast} />
              {insights.topPerformers.slice(0, 2).map((performer, i) => (
                <PerformerCard key={`performer-${i}`} performer={performer} />
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-gray-400">
              Last analyzed: {new Date(insights.generatedAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <AIChatInput />
    </div>
  )
}
