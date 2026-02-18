import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useFilterStore } from '../stores/filterStore'
import type { Website, Category, MonthlyEntry, MonthlyExchangeRate, Tool, Dividend } from '../types'

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (userId: string, year: number, startMonth: number, endMonth: number) =>
    [...dashboardKeys.all, 'stats', userId, year, startMonth, endMonth] as const,
}

export interface DashboardData {
  websites: Website[]
  categories: Category[]
  entries: MonthlyEntry[]
  exchangeRates: MonthlyExchangeRate[]
  expenses: Tool[]
  dividends: Dividend[]
}

export interface MonthlyTrendData {
  month: number
  monthName: string
  revenue: number
  expense: number
  profit: number
}

export interface WebsiteRevenueData {
  websiteId: string
  websiteName: string
  revenue: number
  expense: number
  profit: number
}

export interface CategoryBreakdownData {
  categoryId: string
  categoryName: string
  amount: number
  type: 'revenue' | 'expense'
}

// Fetch all dashboard data
export function useDashboardData() {
  const { user } = useAuthStore()
  const { year, startMonth, endMonth } = useFilterStore()

  return useQuery({
    queryKey: dashboardKeys.stats(user?.id ?? '', year, startMonth, endMonth),
    queryFn: async (): Promise<DashboardData> => {
      if (!user?.id) throw new Error('User not authenticated')

      // Fetch all data in parallel
      const [websitesResult, categoriesResult, entriesResult, ratesResult, expensesResult, dividendsResult] = await Promise.all([
        supabase
          .from('websites')
          .select('*')
          .eq('user_id', user.id)
          .eq('year', year),
        supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .eq('year', year),
        supabase
          .from('monthly_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('year', year)
          .gte('month', startMonth)
          .lte('month', endMonth),
        supabase
          .from('monthly_exchange_rates')
          .select('*')
          .eq('user_id', user.id)
          .eq('year', year)
          .gte('month', startMonth)
          .lte('month', endMonth),
        supabase
          .from('tools')
          .select('*')
          .eq('user_id', user.id)
          .eq('year', year),
        supabase
          .from('dividends')
          .select('*')
          .eq('user_id', user.id)
          .eq('year', year)
          .gte('month', startMonth)
          .lte('month', endMonth),
      ])

      if (websitesResult.error) throw websitesResult.error
      if (categoriesResult.error) throw categoriesResult.error
      if (entriesResult.error) throw entriesResult.error
      if (ratesResult.error) throw ratesResult.error
      if (expensesResult.error) throw expensesResult.error
      if (dividendsResult.error) throw dividendsResult.error

      return {
        websites: websitesResult.data as Website[],
        categories: categoriesResult.data as Category[],
        entries: entriesResult.data as MonthlyEntry[],
        exchangeRates: ratesResult.data as MonthlyExchangeRate[],
        expenses: expensesResult.data as Tool[],
        dividends: dividendsResult.data as Dividend[],
      }
    },
    enabled: !!user?.id,
  })
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

// Process dashboard data into chart-ready formats
export function useDashboardStats() {
  const { data, isLoading, error } = useDashboardData()
  const { startMonth, endMonth } = useFilterStore()

  // Calculate number of months in range for amortization
  const monthsInRange = endMonth - startMonth + 1

  if (!data) {
    return {
      isLoading,
      error,
      totals: { revenue: 0, expense: 0, profit: 0, margin: 0 },
      monthlyTrend: [] as MonthlyTrendData[],
      websiteRevenue: [] as WebsiteRevenueData[],
      revenueByCategory: [] as CategoryBreakdownData[],
      expenseByCategory: [] as CategoryBreakdownData[],
    }
  }

  const { websites, categories, entries, expenses, dividends, exchangeRates } = data

  // Create lookup maps
  const categoryMap = new Map(categories.map(c => [c.id, c]))

  // Create exchange rate map by month (for converting BDT dividends to USD)
  const DEFAULT_EXCHANGE_RATE = 122 // Default if no rate set
  const exchangeRateMap = new Map(exchangeRates.map(r => [r.month, r.rate]))

  // Filter global expenses (not website-specific)
  const globalMonthlyExpenses = expenses.filter(exp =>
    (exp.recurrence === 'monthly' || !exp.recurrence) &&
    !exp.website_id &&
    exp.month >= startMonth &&
    exp.month <= endMonth
  )
  const globalYearlyExpenses = expenses.filter(exp =>
    exp.recurrence === 'yearly' && !exp.website_id
  )

  // Only allocated global expenses are split across websites
  const allocatedGlobalMonthlyExpenses = globalMonthlyExpenses.filter(exp => exp.is_allocated !== false)
  const allocatedGlobalYearlyExpenses = globalYearlyExpenses.filter(exp => exp.is_allocated !== false)

  // Filter website-specific expenses (like domain renewals)
  const websiteExpenses = expenses.filter(exp => exp.website_id)

  // Calculate totals from entries (already filtered by month range in query)
  let totalRevenue = 0
  let totalCategoryExpense = 0

  entries.forEach(entry => {
    const category = categoryMap.get(entry.category_id)
    if (category?.type === 'revenue') {
      totalRevenue += entry.amount
    } else if (category?.type === 'expense') {
      totalCategoryExpense += entry.amount
    }
  })

  // Add dividends to total revenue (convert BDT to USD using exchange rate)
  const totalDividendsUSD = dividends.reduce((sum, div) => {
    const rate = exchangeRateMap.get(div.month) || DEFAULT_EXCHANGE_RATE
    return sum + (div.amount / rate)
  }, 0)
  totalRevenue += totalDividendsUSD

  // Calculate expense totals for the filtered range
  const totalGlobalMonthlyExpense = globalMonthlyExpenses.reduce((sum, exp) => sum + exp.cost_usd, 0)
  // For yearly expenses, amortize only for the months in range
  const totalGlobalYearlyAmortized = globalYearlyExpenses.reduce((sum, exp) => sum + (exp.cost_usd / 12) * monthsInRange, 0)
  // Website-specific expenses (amortized for months in range)
  const totalWebsiteExpenses = websiteExpenses.reduce((sum, exp) => sum + (exp.cost_usd / 12) * monthsInRange, 0)

  const totalGlobalExpense = totalGlobalMonthlyExpense + totalGlobalYearlyAmortized + totalWebsiteExpenses
  const totalExpense = totalCategoryExpense + totalGlobalExpense

  const totalProfit = totalRevenue - totalExpense
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  // Calculate amortized monthly amount for yearly expenses (same for all months)
  const globalYearlyAmortizedPerMonth = globalYearlyExpenses.reduce((sum, exp) => sum + exp.cost_usd / 12, 0)
  const websiteYearlyAmortizedPerMonth = websiteExpenses.reduce((sum, exp) => sum + exp.cost_usd / 12, 0)

  // Monthly trend (only months in range)
  const monthlyTrend: MonthlyTrendData[] = MONTH_NAMES
    .map((name, index) => {
      const month = index + 1
      return { month, monthName: name }
    })
    .filter(m => m.month >= startMonth && m.month <= endMonth)
    .map(({ month, monthName }) => {
      let revenue = 0
      let expense = 0

      // Revenue/expense from categories
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

      // Add dividends for this month (convert BDT to USD)
      dividends.forEach(div => {
        if (div.month === month) {
          const rate = exchangeRateMap.get(month) || DEFAULT_EXCHANGE_RATE
          revenue += div.amount / rate
        }
      })

      // Add global monthly expenses for this specific month
      globalMonthlyExpenses.forEach(exp => {
        if (exp.month === month) {
          expense += exp.cost_usd
        }
      })

      // Add amortized yearly expenses (distributed across all months)
      expense += globalYearlyAmortizedPerMonth + websiteYearlyAmortizedPerMonth

      return {
        month,
        monthName,
        revenue,
        expense,
        profit: revenue - expense,
      }
    })

  // Calculate total global expenses for allocation to websites (only allocated ones)
  const totalAllocatedMonthlyExpense = allocatedGlobalMonthlyExpenses.reduce((sum, exp) => sum + exp.cost_usd, 0)
  const totalAllocatedYearlyAmortized = allocatedGlobalYearlyExpenses.reduce((sum, exp) => sum + (exp.cost_usd / 12) * monthsInRange, 0)
  const totalGlobalExpenseForAllocation = totalAllocatedMonthlyExpense + totalAllocatedYearlyAmortized

  // Count websites with revenue > 0 for fair allocation
  const websitesWithRevenue = websites.filter(website => {
    return entries.some(entry => {
      if (entry.website_id !== website.id) return false
      const category = categoryMap.get(entry.category_id)
      return category?.type === 'revenue' && entry.amount > 0
    })
  })
  const websiteCountForAllocation = Math.max(websitesWithRevenue.length, 1) // Avoid division by 0

  // Global expense per website (equal split among revenue-generating sites)
  const globalExpensePerWebsite = totalGlobalExpenseForAllocation / websiteCountForAllocation

  // Revenue by website (filtered by month range)
  const websiteRevenue: WebsiteRevenueData[] = websites.map(website => {
    let revenue = 0
    let expense = 0

    entries.forEach(entry => {
      if (entry.website_id === website.id) {
        const category = categoryMap.get(entry.category_id)
        if (category?.type === 'revenue') {
          revenue += entry.amount
        } else if (category?.type === 'expense') {
          expense += entry.amount
        }
      }
    })

    // Add website-specific annual expenses (amortized for months in range)
    expenses.forEach(exp => {
      if (exp.website_id === website.id) {
        expense += (exp.cost_usd / 12) * monthsInRange
      }
    })

    // Add allocated global expenses (only for websites with revenue)
    if (revenue > 0) {
      expense += globalExpensePerWebsite
    }

    return {
      websiteId: website.id,
      websiteName: website.name,
      revenue,
      expense,
      profit: revenue - expense,
    }
  }).sort((a, b) => b.revenue - a.revenue)

  // Revenue by category (from filtered entries)
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

  const revenueByCategory: CategoryBreakdownData[] = Array.from(revenueCategoryTotals.entries())
    .map(([categoryId, amount]) => ({
      categoryId,
      categoryName: categoryMap.get(categoryId)?.name || 'Unknown',
      amount,
      type: 'revenue' as const,
    }))
    .sort((a, b) => b.amount - a.amount)

  const expenseByCategory: CategoryBreakdownData[] = Array.from(expenseCategoryTotals.entries())
    .map(([categoryId, amount]) => ({
      categoryId,
      categoryName: categoryMap.get(categoryId)?.name || 'Unknown',
      amount,
      type: 'expense' as const,
    }))
    .sort((a, b) => b.amount - a.amount)

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
    websiteRevenue,
    revenueByCategory,
    expenseByCategory,
  }
}
