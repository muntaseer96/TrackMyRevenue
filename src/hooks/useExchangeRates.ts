import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useYearStore } from '../stores/yearStore'

export interface ExchangeRate {
  id: string
  user_id: string
  year: number
  month: number
  rate: number
  created_at: string | null
  updated_at: string | null
}

// Query keys
export const exchangeRateKeys = {
  all: ['exchangeRates'] as const,
  lists: () => [...exchangeRateKeys.all, 'list'] as const,
  byYearMonth: (userId: string, year: number, month: number) =>
    [...exchangeRateKeys.lists(), userId, year, month] as const,
}

// Default exchange rate (BDT per USD)
export const DEFAULT_EXCHANGE_RATE = 122

// Fetch exchange rate for a specific month
export function useExchangeRate(month: number) {
  const { user } = useAuthStore()
  const { selectedYear } = useYearStore()

  return useQuery({
    queryKey: exchangeRateKeys.byYearMonth(user?.id ?? '', selectedYear, month),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('monthly_exchange_rates')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .eq('month', month)
        .maybeSingle()

      if (error) throw error

      // Return the rate or default if not set
      return data as ExchangeRate | null
    },
    enabled: !!user?.id && month >= 1 && month <= 12,
  })
}

// Upsert exchange rate (create or update)
export function useUpsertExchangeRate() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { selectedYear } = useYearStore()

  return useMutation({
    mutationFn: async ({ month, rate }: { month: number; rate: number }) => {
      if (!user?.id) throw new Error('User not authenticated')

      // Check if entry already exists
      const { data: existing, error: fetchError } = await supabase
        .from('monthly_exchange_rates')
        .select('id')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .eq('month', month)
        .maybeSingle()

      if (fetchError) throw fetchError

      if (existing) {
        // Update existing entry
        const { data, error } = await supabase
          .from('monthly_exchange_rates')
          .update({
            rate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return data as ExchangeRate
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from('monthly_exchange_rates')
          .insert({
            user_id: user.id,
            year: selectedYear,
            month,
            rate,
          })
          .select()
          .single()

        if (error) throw error
        return data as ExchangeRate
      }
    },
    onSuccess: (data) => {
      // Invalidate the specific month's exchange rate
      queryClient.invalidateQueries({
        queryKey: exchangeRateKeys.byYearMonth(user?.id ?? '', data.year, data.month),
      })
    },
  })
}
