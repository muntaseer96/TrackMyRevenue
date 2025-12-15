import { useMemo } from 'react'
import { useDashboardStats } from './useDashboardStats'
import { useInvestmentStats } from './useInvestments'
import { useFilterStore } from '../stores/filterStore'
import type { FinancialSummary } from '../types/ai'

export function useFinancialSummary() {
  const { year, startMonth, endMonth } = useFilterStore()
  const dashboardStats = useDashboardStats()
  const investmentStats = useInvestmentStats()

  const isLoading = dashboardStats.isLoading || investmentStats.isLoading
  const error = dashboardStats.error || null

  const summary = useMemo((): FinancialSummary | null => {
    if (isLoading || !dashboardStats.totals) {
      return null
    }

    // Transform monthly trend data
    const monthlyTrends = dashboardStats.monthlyTrend.map(m => ({
      month: m.month,
      revenue: m.revenue,
      expense: m.expense,
      profit: m.profit,
    }))

    // Transform website performance data
    const websitePerformance = dashboardStats.websiteRevenue.map(w => ({
      name: w.websiteName,
      revenue: w.revenue,
      expense: w.expense,
      profit: w.profit,
      margin: w.revenue > 0 ? (w.profit / w.revenue) * 100 : 0,
    }))

    // Transform category breakdowns
    const revenueCategories = dashboardStats.revenueByCategory.map(c => ({
      name: c.categoryName,
      amount: c.amount,
    }))

    const expenseCategories = dashboardStats.expenseByCategory.map(c => ({
      name: c.categoryName,
      amount: c.amount,
    }))

    // Calculate recurring expense totals
    // Monthly total is sum of monthly expenses in the range
    // Yearly amortized is the total yearly expenses divided by 12 times months in range
    const monthsInRange = endMonth - startMonth + 1
    const monthlyTotal = expenseCategories.reduce((sum, c) => sum + c.amount, 0) / monthsInRange
    const yearlyAmortized = 0 // This is already included in totals from dashboard

    return {
      period: {
        year,
        startMonth,
        endMonth,
      },
      totals: {
        revenue: dashboardStats.totals.revenue,
        expense: dashboardStats.totals.expense,
        profit: dashboardStats.totals.profit,
        margin: dashboardStats.totals.margin,
      },
      monthlyTrends,
      websitePerformance,
      categoryBreakdown: {
        revenue: revenueCategories,
        expense: expenseCategories,
      },
      investments: {
        principal: investmentStats.totalPortfolio,
        dividends: investmentStats.totalDividends,
        yield: investmentStats.dividendYield,
      },
      recurringExpenses: {
        monthlyTotal,
        yearlyAmortized,
      },
    }
  }, [
    isLoading,
    dashboardStats.totals,
    dashboardStats.monthlyTrend,
    dashboardStats.websiteRevenue,
    dashboardStats.revenueByCategory,
    dashboardStats.expenseByCategory,
    investmentStats.totalPortfolio,
    investmentStats.totalDividends,
    investmentStats.dividendYield,
    year,
    startMonth,
    endMonth,
  ])

  // Create a hash of the data for cache invalidation
  const dataHash = useMemo(() => {
    if (!summary) return ''
    return JSON.stringify({
      totals: summary.totals,
      monthlyTrends: summary.monthlyTrends,
      websitePerformance: summary.websitePerformance,
      period: summary.period,
    })
  }, [summary])

  return {
    summary,
    dataHash,
    isLoading,
    error,
  }
}
