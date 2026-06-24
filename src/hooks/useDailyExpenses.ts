import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { DEFAULT_EXCHANGE_RATE } from './useExchangeRates'
import type { DailyExpense, DailyExpenseFormData, DailyExpenseCategory } from '../types'

// Query keys
export const dailyExpenseKeys = {
  all: ['dailyExpenses'] as const,
  lists: () => [...dailyExpenseKeys.all, 'list'] as const,
  list: (userId: string, limit: number) => [...dailyExpenseKeys.lists(), userId, limit] as const,
  months: () => [...dailyExpenseKeys.all, 'month'] as const,
  month: (userId: string, year: number, month: number) =>
    [...dailyExpenseKeys.months(), userId, year, month] as const,
}

/** Convert any expense amount to BDT for aggregation. */
export function toBDT(amount: number, currency: string): number {
  return currency === 'USD' ? amount * DEFAULT_EXCHANGE_RATE : amount
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Recent expenses, newest first. */
export function useDailyExpenses(limit = 50) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: dailyExpenseKeys.list(user?.id ?? '', limit),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('daily_expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data as DailyExpense[]
    },
    enabled: !!user?.id,
  })
}

/** All expenses within a given calendar month (1-indexed). */
export function useDailyExpensesByMonth(year: number, month: number) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: dailyExpenseKeys.month(user?.id ?? '', year, month),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const start = `${year}-${pad2(month)}-01`
      // First day of the next month as an exclusive upper bound.
      const nextMonth = month === 12 ? 1 : month + 1
      const nextYear = month === 12 ? year + 1 : year
      const end = `${nextYear}-${pad2(nextMonth)}-01`

      const { data, error } = await supabase
        .from('daily_expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('expense_date', start)
        .lt('expense_date', end)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as DailyExpense[]
    },
    enabled: !!user?.id,
  })
}

export function useCreateDailyExpense() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (data: DailyExpenseFormData) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data: expense, error } = await supabase
        .from('daily_expenses')
        .insert({
          user_id: user.id,
          expense_date: data.expense_date,
          amount: data.amount,
          currency: data.currency,
          category: data.category,
          note: data.note || null,
          raw_input: data.raw_input || null,
        })
        .select()
        .single()

      if (error) throw error
      return expense as DailyExpense
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyExpenseKeys.all })
    },
  })
}

export function useDeleteDailyExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('daily_expenses').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyExpenseKeys.all })
    },
  })
}

export interface DailyExpenseStats {
  isLoading: boolean
  todayTotal: number
  monthTotal: number
  /** Average per day across days ELAPSED so far this month (realistic running average). */
  avgDaily: number
  daysElapsed: number
  topCategory: { category: DailyExpenseCategory; total: number } | null
  categoryBreakdown: { category: DailyExpenseCategory; total: number }[]
}

/**
 * Dashboard summary for the CURRENT calendar month.
 * Average daily expense uses days elapsed in the current month (see UI note),
 * so early in the month the figure reflects the running pace, not a full-month divide.
 */
export function useDailyExpenseStats(): DailyExpenseStats {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const todayStr = `${year}-${pad2(month)}-${pad2(now.getDate())}`
  const daysElapsed = now.getDate()

  const { data: expenses, isLoading } = useDailyExpensesByMonth(year, month)

  if (!expenses) {
    return {
      isLoading,
      todayTotal: 0,
      monthTotal: 0,
      avgDaily: 0,
      daysElapsed,
      topCategory: null,
      categoryBreakdown: [],
    }
  }

  let todayTotal = 0
  let monthTotal = 0
  const byCategory = new Map<DailyExpenseCategory, number>()

  for (const e of expenses) {
    const bdt = toBDT(e.amount, e.currency)
    monthTotal += bdt
    if (e.expense_date === todayStr) todayTotal += bdt
    byCategory.set(e.category, (byCategory.get(e.category) || 0) + bdt)
  }

  const categoryBreakdown = Array.from(byCategory.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)

  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null
  const avgDaily = daysElapsed > 0 ? monthTotal / daysElapsed : 0

  return {
    isLoading,
    todayTotal,
    monthTotal,
    avgDaily,
    daysElapsed,
    topCategory,
    categoryBreakdown,
  }
}
