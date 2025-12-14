import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useYearStore } from '../stores/yearStore'
import { useFilterStore } from '../stores/filterStore'
import type { Investment, Dividend, DividendWithInvestment } from '../types'

// Query keys
export const investmentKeys = {
  all: ['investments'] as const,
  lists: () => [...investmentKeys.all, 'list'] as const,
  list: (userId: string, year: number) => [...investmentKeys.lists(), userId, year] as const,
  details: () => [...investmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...investmentKeys.details(), id] as const,
}

export const dividendKeys = {
  all: ['dividends'] as const,
  lists: () => [...dividendKeys.all, 'list'] as const,
  list: (userId: string, year: number, startMonth?: number, endMonth?: number) =>
    [...dividendKeys.lists(), userId, year, startMonth, endMonth] as const,
  byInvestment: (investmentId: string) => [...dividendKeys.all, 'investment', investmentId] as const,
}

// Form data types
export interface InvestmentFormData {
  company_name: string
  principal_amount: number
  notes?: string | null
}

export interface DividendFormData {
  investment_id: string
  month: number
  amount: number
}

// Fetch all investments for current user and selected year
export function useInvestments() {
  const { user } = useAuthStore()
  const { selectedYear } = useYearStore()

  return useQuery({
    queryKey: investmentKeys.list(user?.id ?? '', selectedYear),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .order('company_name', { ascending: true })

      if (error) throw error
      return data as Investment[]
    },
    enabled: !!user?.id,
  })
}

// Fetch single investment by ID
export function useInvestment(id: string | undefined) {
  return useQuery({
    queryKey: investmentKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Investment ID required')

      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Investment
    },
    enabled: !!id,
  })
}

// Create investment mutation
export function useCreateInvestment() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { selectedYear } = useYearStore()

  return useMutation({
    mutationFn: async (data: InvestmentFormData) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data: investment, error } = await supabase
        .from('investments')
        .insert({
          user_id: user.id,
          company_name: data.company_name,
          principal_amount: data.principal_amount,
          notes: data.notes || null,
          year: selectedYear,
        })
        .select()
        .single()

      if (error) throw error
      return investment as Investment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.lists() })
    },
  })
}

// Update investment mutation
export function useUpdateInvestment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InvestmentFormData }) => {
      const { data: investment, error } = await supabase
        .from('investments')
        .update({
          company_name: data.company_name,
          principal_amount: data.principal_amount,
          notes: data.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return investment as Investment
    },
    onSuccess: (investment) => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: investmentKeys.detail(investment.id) })
    },
  })
}

// Delete investment mutation
export function useDeleteInvestment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.lists() })
      queryClient.removeQueries({ queryKey: investmentKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: dividendKeys.byInvestment(id) })
    },
  })
}

// Fetch dividends for selected year and date range
export function useDividends(investmentId?: string) {
  const { user } = useAuthStore()
  const { year, startMonth, endMonth } = useFilterStore()

  return useQuery({
    queryKey: investmentId
      ? dividendKeys.byInvestment(investmentId)
      : dividendKeys.list(user?.id ?? '', year, startMonth, endMonth),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      let query = supabase
        .from('dividends')
        .select('*, investment:investments(*)')
        .eq('user_id', user.id)
        .eq('year', year)
        .gte('month', startMonth)
        .lte('month', endMonth)
        .order('month', { ascending: true })

      if (investmentId) {
        query = query.eq('investment_id', investmentId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as DividendWithInvestment[]
    },
    enabled: !!user?.id,
  })
}

// Fetch all dividends for a year (for dashboard calculations)
export function useAllDividends() {
  const { user } = useAuthStore()
  const { year, startMonth, endMonth } = useFilterStore()

  return useQuery({
    queryKey: ['dividends', 'all', user?.id, year, startMonth, endMonth],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('dividends')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', year)
        .gte('month', startMonth)
        .lte('month', endMonth)

      if (error) throw error
      return data as Dividend[]
    },
    enabled: !!user?.id,
  })
}

// Create dividend mutation
export function useCreateDividend() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { year } = useFilterStore()

  return useMutation({
    mutationFn: async (data: DividendFormData) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data: dividend, error } = await supabase
        .from('dividends')
        .insert({
          user_id: user.id,
          investment_id: data.investment_id,
          year: year,
          month: data.month,
          amount: data.amount,
        })
        .select()
        .single()

      if (error) throw error
      return dividend as Dividend
    },
    onSuccess: (dividend) => {
      queryClient.invalidateQueries({ queryKey: dividendKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dividendKeys.byInvestment(dividend.investment_id) })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Update dividend mutation
export function useUpdateDividend() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DividendFormData> }) => {
      const { data: dividend, error } = await supabase
        .from('dividends')
        .update({
          month: data.month,
          amount: data.amount,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return dividend as Dividend
    },
    onSuccess: (dividend) => {
      queryClient.invalidateQueries({ queryKey: dividendKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dividendKeys.byInvestment(dividend.investment_id) })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Delete dividend mutation
export function useDeleteDividend() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, investmentId }: { id: string; investmentId: string }) => {
      const { error } = await supabase
        .from('dividends')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, investmentId }
    },
    onSuccess: ({ investmentId }) => {
      queryClient.invalidateQueries({ queryKey: dividendKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dividendKeys.byInvestment(investmentId) })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Calculate investment stats
export function useInvestmentStats() {
  const { data: investments, isLoading: investmentsLoading } = useInvestments()
  const { data: dividends, isLoading: dividendsLoading } = useDividends()

  const isLoading = investmentsLoading || dividendsLoading

  if (!investments || !dividends) {
    return {
      isLoading,
      totalPortfolio: 0,
      totalDividends: 0,
      dividendYield: 0,
    }
  }

  const totalPortfolio = investments.reduce((sum, inv) => sum + inv.principal_amount, 0)
  const totalDividends = dividends.reduce((sum, div) => sum + div.amount, 0)
  const dividendYield = totalPortfolio > 0 ? (totalDividends / totalPortfolio) * 100 : 0

  return {
    isLoading,
    totalPortfolio,
    totalDividends,
    dividendYield,
  }
}
