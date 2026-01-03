import { useState, useEffect, useCallback, useRef } from 'react'
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

  // Track last processed dataHash to prevent re-processing
  const lastProcessedHash = useRef<string>('')
  const hasFetched = useRef(false)

  // Load cached insights on mount and when data changes
  useEffect(() => {
    if (!dataHash || dataHash === lastProcessedHash.current) return

    // Reset fetch flag when data changes
    hasFetched.current = false

    const cached = getCachedInsights()
    if (cached) {
      setInsights(cached.insights)
      // Mark as stale if data has changed or cache is old
      setIsStale(!isCacheValid(cached, dataHash))
    }
    lastProcessedHash.current = dataHash
  }, [dataHash])

  // Auto-fetch insights when summary is ready and cache is invalid
  useEffect(() => {
    if (!hasApiKey || summaryLoading || !summary || !dataHash) return
    if (hasFetched.current) return // Prevent multiple fetches

    const cached = getCachedInsights()

    // If we have valid cache, don't fetch
    if (isCacheValid(cached, dataHash)) {
      return
    }

    // Cache is invalid (data changed or expired) - fetch new insights
    hasFetched.current = true
    fetchInsights()
  }, [hasApiKey, summaryLoading, dataHash]) // Removed summary from deps - only need dataHash

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
