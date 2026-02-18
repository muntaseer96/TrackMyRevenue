import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useYearStore } from '../stores/yearStore'
import type { Category, MonthlyEntry, MonthlyExchangeRate, Tool } from '../types'

// Query keys
export const websiteStatsKeys = {
  all: ['websiteStats'] as const,
  stats: (websiteId: string, year: number) => [...websiteStatsKeys.all, websiteId, year] as const,
}

export interface WebsiteStatsData {
  categories: Category[]
  entries: MonthlyEntry[]
  exchangeRates: MonthlyExchangeRate[]
  expenses: Tool[]
  globalExpenses: Tool[]
  allEntries: MonthlyEntry[]
}

export interface WebsiteMonthlyTrendData {
  month: number
  monthName: string
  revenue: number
  expense: number
  profit: number
}

export interface WebsiteCategoryData {
  categoryId: string
  categoryName: string
  amount: number
  type: 'revenue' | 'expense'
}

// Fetch website-specific data
export function useWebsiteStatsData(websiteId: string | undefined) {
  const { selectedYear } = useYearStore()

  return useQuery({
    queryKey: websiteStatsKeys.stats(websiteId ?? '', selectedYear),
    queryFn: async (): Promise<WebsiteStatsData> => {
      if (!websiteId) throw new Error('Website ID required')

      // Get user_id from any category for this website
      const { data: categoryCheck } = await supabase
        .from('categories')
        .select('user_id')
        .eq('website_id', websiteId)
        .limit(1)
        .single()

      const userId = categoryCheck?.user_id

      // Fetch all data in parallel
      const [categoriesResult, entriesResult, ratesResult, expensesResult, globalExpensesResult, allEntriesResult] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('website_id', websiteId),
        supabase
          .from('monthly_entries')
          .select('*')
          .eq('website_id', websiteId)
          .eq('year', selectedYear),
        supabase
          .from('monthly_exchange_rates')
          .select('*')
          .eq('year', selectedYear),
        supabase
          .from('tools')
          .select('*')
          .eq('website_id', websiteId)
          .eq('year', selectedYear),
        // Fetch global expenses (no website_id)
        userId ? supabase
          .from('tools')
          .select('*')
          .eq('user_id', userId)
          .eq('year', selectedYear)
          .is('website_id', null) : Promise.resolve({ data: [], error: null }),
        // Fetch all entries to determine which websites have revenue (for expense allocation)
        userId ? supabase
          .from('monthly_entries')
          .select('*')
          .eq('user_id', userId)
          .eq('year', selectedYear) : Promise.resolve({ data: [], error: null }),
      ])

      if (categoriesResult.error) throw categoriesResult.error
      if (entriesResult.error) throw entriesResult.error
      if (ratesResult.error) throw ratesResult.error
      if (expensesResult.error) throw expensesResult.error
      if (globalExpensesResult.error) throw globalExpensesResult.error
      if (allEntriesResult.error) throw allEntriesResult.error

      return {
        categories: categoriesResult.data as Category[],
        entries: entriesResult.data as MonthlyEntry[],
        exchangeRates: ratesResult.data as MonthlyExchangeRate[],
        expenses: expensesResult.data as Tool[],
        globalExpenses: (globalExpensesResult.data || []) as Tool[],
        allEntries: (allEntriesResult.data || []) as MonthlyEntry[],
      }
    },
    enabled: !!websiteId,
  })
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

// Process website data into chart-ready formats
export function useWebsiteStats(websiteId: string | undefined) {
  const { data, isLoading, error } = useWebsiteStatsData(websiteId)

  if (!data) {
    return {
      isLoading,
      error,
      totals: { revenue: 0, expense: 0, profit: 0, margin: 0 },
      monthlyTrend: [] as WebsiteMonthlyTrendData[],
      revenueByCategory: [] as WebsiteCategoryData[],
      expenseByCategory: [] as WebsiteCategoryData[],
      avgExchangeRate: 122,
    }
  }

  const { categories, entries, exchangeRates, expenses, globalExpenses: allGlobalExpenses, allEntries } = data

  // Only include global expenses marked for allocation
  const globalExpenses = allGlobalExpenses.filter(exp => exp.is_allocated !== false)

  // Create category lookup
  const categoryMap = new Map(categories.map(c => [c.id, c]))

  // Count websites with revenue entries (for fair expense allocation)
  const websitesWithRevenue = new Set<string>()
  allEntries.forEach(entry => {
    // Check if this entry is revenue by checking if this website has revenue
    // We'll count any website with positive entry amounts
    if (entry.amount > 0 && entry.website_id) {
      websitesWithRevenue.add(entry.website_id)
    }
  })
  const websiteCountForAllocation = Math.max(websitesWithRevenue.size, 1)

  // Helper function to get allocated global expense for a specific month
  const getMonthlyAllocatedGlobalExpense = (month: number): number => {
    // Get global expenses for this specific month
    const monthGlobalExpenses = globalExpenses.filter(exp => exp.month === month)
    const monthlyTotal = monthGlobalExpenses.reduce((sum, exp) => sum + exp.cost_usd, 0)
    return monthlyTotal / websiteCountForAllocation
  }

  // Calculate amortized annual expenses (website-specific yearly expenses spread across 12 months)
  const websiteYearlyExpenses = expenses.filter(exp => exp.recurrence === 'yearly')
  const annualExpenseAmortized = websiteYearlyExpenses.reduce((sum, exp) => sum + exp.cost_usd / 12, 0)

  // Calculate average exchange rate
  const avgExchangeRate = exchangeRates.length
    ? exchangeRates.reduce((sum, r) => sum + r.rate, 0) / exchangeRates.length
    : 122

  // Calculate totals
  let totalRevenue = 0
  let totalExpense = 0

  entries.forEach(entry => {
    const category = categoryMap.get(entry.category_id)
    if (category?.type === 'revenue') {
      totalRevenue += entry.amount
    } else if (category?.type === 'expense') {
      totalExpense += entry.amount
    }
  })

  // Add website-specific yearly expenses (full amount for yearly summary)
  totalExpense += websiteYearlyExpenses.reduce((sum, exp) => sum + exp.cost_usd, 0)

  // Add allocated global expenses (sum of actual monthly data)
  const totalAllocatedGlobalExpense = Array.from({ length: 12 }, (_, i) => i + 1)
    .reduce((sum, month) => sum + getMonthlyAllocatedGlobalExpense(month), 0)
  totalExpense += totalAllocatedGlobalExpense

  const totalProfit = totalRevenue - totalExpense
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  // Monthly trend (all 12 months)
  const monthlyTrend: WebsiteMonthlyTrendData[] = MONTH_NAMES.map((name, index) => {
    const month = index + 1
    let revenue = 0
    let expense = 0

    entries.forEach(entry => {
      if (entry.month === month) {
        const category = categoryMap.get(entry.category_id)
        if (category?.type === 'revenue') {
          revenue += entry.amount
        } else if (category?.type === 'expense') {
          expense += entry.amount
        }
      }
    })

    // Add amortized annual expenses to each month (website-specific yearly expenses)
    expense += annualExpenseAmortized

    // Add allocated global expenses for THIS specific month only
    expense += getMonthlyAllocatedGlobalExpense(month)

    return {
      month,
      monthName: name,
      revenue,
      expense,
      profit: revenue - expense,
    }
  })

  // Category breakdowns
  const revenueCategoryTotals = new Map<string, number>()
  const expenseCategoryTotals = new Map<string, number>()

  entries.forEach(entry => {
    const category = categoryMap.get(entry.category_id)
    if (!category) return

    if (category.type === 'revenue') {
      const current = revenueCategoryTotals.get(category.id) || 0
      revenueCategoryTotals.set(category.id, current + entry.amount)
    } else if (category.type === 'expense') {
      const current = expenseCategoryTotals.get(category.id) || 0
      expenseCategoryTotals.set(category.id, current + entry.amount)
    }
  })

  const revenueByCategory: WebsiteCategoryData[] = Array.from(revenueCategoryTotals.entries())
    .map(([categoryId, amount]) => ({
      categoryId,
      categoryName: categoryMap.get(categoryId)?.name || 'Unknown',
      amount,
      type: 'revenue' as const,
    }))
    .sort((a, b) => b.amount - a.amount)

  // Build expense by category list from monthly entries
  const expenseByCategory: WebsiteCategoryData[] = Array.from(expenseCategoryTotals.entries())
    .map(([categoryId, amount]) => ({
      categoryId,
      categoryName: categoryMap.get(categoryId)?.name || 'Unknown',
      amount,
      type: 'expense' as const,
    }))

  // Add annual expenses (from tools table) to expense breakdown
  // These are shown with their full year amount (matching the totals)
  expenses.forEach(exp => {
    expenseByCategory.push({
      categoryId: exp.id, // Use expense id as category id
      categoryName: exp.name,
      amount: exp.cost_usd, // Full year amount for breakdown display
      type: 'expense' as const,
    })
  })

  // Add allocated global expenses to expense breakdown
  if (totalAllocatedGlobalExpense > 0) {
    expenseByCategory.push({
      categoryId: 'allocated-global',
      categoryName: 'Shared Expenses (Allocated)',
      amount: totalAllocatedGlobalExpense,
      type: 'expense' as const,
    })
  }

  // Sort by amount descending
  expenseByCategory.sort((a, b) => b.amount - a.amount)

  return {
    isLoading,
    error,
    totals: {
      revenue: totalRevenue,
      expense: totalExpense,
      profit: totalProfit,
      margin: profitMargin,
    },
    monthlyTrend,
    revenueByCategory,
    expenseByCategory,
    avgExchangeRate,
  }
}
