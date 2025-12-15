// Financial data summary for AI analysis
export interface FinancialSummary {
  period: {
    year: number
    startMonth: number
    endMonth: number
  }
  totals: {
    revenue: number
    expense: number
    profit: number
    margin: number
  }
  monthlyTrends: {
    month: number
    revenue: number
    expense: number
    profit: number
  }[]
  websitePerformance: {
    name: string
    revenue: number
    expense: number
    profit: number
    margin: number
  }[]
  categoryBreakdown: {
    revenue: { name: string; amount: number }[]
    expense: { name: string; amount: number }[]
  }
  investments: {
    principal: number
    dividends: number
    yield: number
  }
  recurringExpenses: {
    monthlyTotal: number
    yearlyAmortized: number
  }
}

// AI-generated insights
export interface TrendInsight {
  type: 'growth' | 'decline' | 'stable'
  metric: string
  percentChange: number
  description: string
  details?: string
}

export interface AnomalyInsight {
  severity: 'low' | 'medium' | 'high'
  metric: string
  month: number
  description: string
  suggestion?: string
}

export interface PerformerInsight {
  type: 'website' | 'category'
  name: string
  metric: string
  value: number
  reason: string
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action: string
}

export interface ForecastInsight {
  nextMonth: number
  projectedRevenue: number
  projectedExpense: number
  projectedProfit: number
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

export interface AlertInsight {
  severity: 'warning' | 'critical'
  title: string
  description: string
  action?: string
}

export interface AIInsights {
  summary: {
    health: 'excellent' | 'good' | 'fair' | 'poor'
    description: string
    keyMetric: string
  }
  trends: TrendInsight[]
  anomalies: AnomalyInsight[]
  topPerformers: PerformerInsight[]
  recommendations: Recommendation[]
  forecast: ForecastInsight
  alerts: AlertInsight[]
  generatedAt: number
}

// Cache structure
export interface CachedInsights {
  insights: AIInsights
  timestamp: number
  dataHash: string
}
