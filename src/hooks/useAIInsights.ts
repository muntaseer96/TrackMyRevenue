import { useState, useEffect, useCallback } from 'react'
import { useFinancialSummary } from './useFinancialSummary'
import { analyzeFinancials } from '../lib/claude'
import type { AIInsights, CachedInsights } from '../types/ai'

const CACHE_KEY = 'ai_insights'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

function getCachedInsights(): CachedInsights | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    return JSON.parse(cached) as CachedInsights
  } catch {
    return null
  }
}

function setCachedInsights(insights: AIInsights, dataHash: string): void {
  try {
    const cached: CachedInsights = {
      insights,
      timestamp: Date.now(),
      dataHash,
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
  } catch {
    // Ignore storage errors
  }
}

function isCacheValid(cached: CachedInsights | null, currentDataHash: string): boolean {
  if (!cached) return false

  // Check if data has changed
  if (cached.dataHash !== currentDataHash) return false

  // Check if cache is expired
  const age = Date.now() - cached.timestamp
  if (age > CACHE_DURATION) return false

  return true
}

export function useAIInsights() {
  const { summary, dataHash, isLoading: summaryLoading, error: summaryError } = useFinancialSummary()
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isStale, setIsStale] = useState(false)

  // Check for API key availability
  const hasApiKey = Boolean(import.meta.env.VITE_CLAUDE_API_KEY)

  // Load cached insights on mount
  useEffect(() => {
    const cached = getCachedInsights()
    if (cached) {
      setInsights(cached.insights)
      // Mark as stale if data has changed or cache is old
      setIsStale(!isCacheValid(cached, dataHash))
    }
  }, [dataHash])

  // Auto-fetch insights when summary is ready and cache is invalid
  useEffect(() => {
    if (!hasApiKey || summaryLoading || !summary || !dataHash) return

    const cached = getCachedInsights()

    // If we have valid cache, use it
    if (isCacheValid(cached, dataHash)) {
      if (cached) {
        setInsights(cached.insights)
        setIsStale(false)
      }
      return
    }

    // Cache is invalid (data changed or expired) - fetch new insights
    fetchInsights()
  }, [hasApiKey, summaryLoading, summary, dataHash])

  const fetchInsights = useCallback(async () => {
    if (!summary || !hasApiKey) return

    setIsLoading(true)
    setError(null)

    try {
      const newInsights = await analyzeFinancials(summary)
      setInsights(newInsights)
      setCachedInsights(newInsights, dataHash)
      setIsStale(false)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to analyze financials'))
      // Keep showing stale data if available
    } finally {
      setIsLoading(false)
    }
  }, [summary, dataHash, hasApiKey])

  const refresh = useCallback(() => {
    fetchInsights()
  }, [fetchInsights])

  return {
    insights,
    isLoading: isLoading || summaryLoading,
    error: error || summaryError,
    isStale,
    hasApiKey,
    refresh,
  }
}
