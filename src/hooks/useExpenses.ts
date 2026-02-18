import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useYearStore } from '../stores/yearStore'
import type { Tool } from '../types'

// Query keys
export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (userId: string, year: number) => [...expenseKeys.lists(), userId, year] as const,
  listByMonth: (userId: string, year: number, month: number) =>
    [...expenseKeys.lists(), userId, year, month] as const,
  monthly: (userId: string, year: number, month: number) =>
    [...expenseKeys.all, 'monthly', userId, year, month] as const,
  yearly: (userId: string, year: number) =>
    [...expenseKeys.all, 'yearly', userId, year] as const,
  templates: (userId: string, year: number) =>
    [...expenseKeys.all, 'templates', userId, year] as const,
  byWebsite: (userId: string, year: number, websiteId: string) =>
    [...expenseKeys.all, 'website', userId, year, websiteId] as const,
}

// Fetch all expenses for current user and selected year
export function useExpenses() {
  const { user } = useAuthStore()
  const { selectedYear } = useYearStore()

  return useQuery({
    queryKey: expenseKeys.list(user?.id ?? '', selectedYear),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .order('month', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      return data as Tool[]
    },
    enabled: !!user?.id,
  })
}

// Fetch expenses for a specific month (both monthly and yearly where due_month matches)
export function useExpensesByMonth(month: number) {
  const { user } = useAuthStore()
  const { selectedYear } = useYearStore()

  return useQuery({
    queryKey: expenseKeys.listByMonth(user?.id ?? '', selectedYear, month),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .eq('month', month)
        .is('website_id', null) // Global expenses only
        .order('name', { ascending: true })

      if (error) throw error
      return data as Tool[]
    },
    enabled: !!user?.id && month >= 1 && month <= 12,
  })
}

// Fetch only monthly recurring expenses for a specific month
export function useMonthlyExpenses(month: number) {
  const { user } = useAuthStore()
  const { selectedYear } = useYearStore()

  return useQuery({
    queryKey: expenseKeys.monthly(user?.id ?? '', selectedYear, month),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .eq('month', month)
        .eq('recurrence', 'monthly')
        .is('website_id', null) // Global expenses only
        .order('name', { ascending: true })

      if (error) throw error
      return data as Tool[]
    },
    enabled: !!user?.id && month >= 1 && month <= 12,
  })
}

// Fetch all yearly expenses for the year
export function useYearlyExpenses() {
  const { user } = useAuthStore()
  const { selectedYear } = useYearStore()

  return useQuery({
    queryKey: expenseKeys.yearly(user?.id ?? '', selectedYear),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .eq('recurrence', 'yearly')
        .is('website_id', null) // Global expenses only
        .order('due_month', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      return data as Tool[]
    },
    enabled: !!user?.id,
  })
}

// Fetch domain expenses for a specific website
export function useWebsiteExpenses(websiteId: string) {
  const { user } = useAuthStore()
  const { selectedYear } = useYearStore()

  return useQuery({
    queryKey: expenseKeys.byWebsite(user?.id ?? '', selectedYear, websiteId),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .eq('website_id', websiteId)
        .order('name', { ascending: true })

      if (error) throw error
      return data as Tool[]
    },
    enabled: !!user?.id && !!websiteId,
  })
}

// Fetch template expenses (for auto-population)
export function useExpenseTemplates() {
  const { user } = useAuthStore()
  const { selectedYear } = useYearStore()

  return useQuery({
    queryKey: expenseKeys.templates(user?.id ?? '', selectedYear),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .eq('is_template', true)
        .is('website_id', null)
        .order('name', { ascending: true })

      if (error) throw error
      return data as Tool[]
    },
    enabled: !!user?.id,
  })
}

// Create expense mutation
export function useCreateExpense() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { selectedYear } = useYearStore()

  return useMutation({
    mutationFn: async ({
      name,
      month,
      costUsd,
      exchangeRate,
      recurrence = 'monthly',
      dueMonth = null,
      websiteId = null,
      isTemplate = false,
      isAllocated = true,
    }: {
      name: string
      month: number
      costUsd: number
      exchangeRate: number
      recurrence?: 'monthly' | 'yearly'
      dueMonth?: number | null
      websiteId?: string | null
      isTemplate?: boolean
      isAllocated?: boolean
    }) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('tools')
        .insert({
          user_id: user.id,
          name,
          year: selectedYear,
          month,
          cost_usd: costUsd,
          exchange_rate: exchangeRate,
          recurrence,
          due_month: recurrence === 'yearly' ? dueMonth : null,
          website_id: websiteId,
          is_template: isTemplate,
          is_allocated: isAllocated,
        })
        .select()
        .single()

      if (error) throw error
      return data as Tool
    },
    onSuccess: () => {
      // Invalidate all expense queries
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

// Update expense mutation
export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      name,
      costUsd,
      exchangeRate,
      recurrence,
      dueMonth,
      websiteId,
      isTemplate,
      isAllocated,
    }: {
      id: string
      name: string
      costUsd: number
      exchangeRate: number
      recurrence?: 'monthly' | 'yearly'
      dueMonth?: number | null
      websiteId?: string | null
      isTemplate?: boolean
      isAllocated?: boolean
    }) => {
      const updateData: Record<string, unknown> = {
        name,
        cost_usd: costUsd,
        exchange_rate: exchangeRate,
      }

      if (recurrence !== undefined) {
        updateData.recurrence = recurrence
        updateData.due_month = recurrence === 'yearly' ? dueMonth : null
      }
      if (websiteId !== undefined) updateData.website_id = websiteId
      if (isTemplate !== undefined) updateData.is_template = isTemplate
      if (isAllocated !== undefined) updateData.is_allocated = isAllocated

      const { data, error } = await supabase
        .from('tools')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Tool
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

// Delete expense mutation
export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tools').delete().eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

// Auto-populate expenses from last month's templates
export function useAutoPopulateExpenses() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { selectedYear } = useYearStore()

  return useMutation({
    mutationFn: async ({
      targetMonth,
      exchangeRate,
    }: {
      targetMonth: number
      exchangeRate: number
    }) => {
      if (!user?.id) throw new Error('User not authenticated')

      // Find the most recent month with expenses before targetMonth
      let sourceMonth = targetMonth - 1
      let sourceYear = selectedYear

      if (sourceMonth < 1) {
        sourceMonth = 12
        sourceYear = selectedYear - 1
      }

      // Get expenses from the source month (templates or regular monthly expenses)
      const { data: sourceExpenses, error: fetchError } = await supabase
        .from('tools')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', sourceYear)
        .eq('month', sourceMonth)
        .eq('recurrence', 'monthly')
        .is('website_id', null)

      if (fetchError) throw fetchError
      if (!sourceExpenses || sourceExpenses.length === 0) {
        return [] // No expenses to copy
      }

      // Create new expenses for the target month
      const newExpenses = sourceExpenses.map(expense => ({
        user_id: user.id,
        name: expense.name,
        year: selectedYear,
        month: targetMonth,
        cost_usd: expense.cost_usd,
        exchange_rate: exchangeRate,
        recurrence: 'monthly' as const,
        due_month: null,
        website_id: null,
        is_template: false,
        is_allocated: expense.is_allocated ?? true,
      }))

      const { data, error } = await supabase
        .from('tools')
        .insert(newExpenses)
        .select()

      if (error) throw error
      return data as Tool[]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

// Create a yearly expense (shows in due month, amortized across all months)
export function useCreateYearlyExpense() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { selectedYear } = useYearStore()

  return useMutation({
    mutationFn: async ({
      name,
      costUsd,
      dueMonth,
      exchangeRate,
      websiteId = null,
      isAllocated = true,
    }: {
      name: string
      costUsd: number
      dueMonth: number
      exchangeRate: number
      websiteId?: string | null
      isAllocated?: boolean
    }) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('tools')
        .insert({
          user_id: user.id,
          name,
          year: selectedYear,
          month: dueMonth, // Stored in the due month
          cost_usd: costUsd,
          exchange_rate: exchangeRate,
          recurrence: 'yearly',
          due_month: dueMonth,
          website_id: websiteId,
          is_template: false,
          is_allocated: isAllocated,
        })
        .select()
        .single()

      if (error) throw error
      return data as Tool
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

// Helper: Calculate total monthly expense impact (including amortized yearly)
export function calculateMonthlyExpenseImpact(
  monthlyExpenses: Tool[],
  yearlyExpenses: Tool[]
): number {
  // Sum of monthly expenses
  const monthlyTotal = monthlyExpenses.reduce((sum, exp) => sum + exp.cost_usd, 0)

  // Sum of amortized yearly expenses (each divided by 12)
  const yearlyAmortized = yearlyExpenses.reduce((sum, exp) => sum + exp.cost_usd / 12, 0)

  return monthlyTotal + yearlyAmortized
}
