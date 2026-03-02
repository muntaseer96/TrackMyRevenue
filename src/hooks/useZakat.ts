import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { ZakatYear, ZakatPayment, ZakatYearFormData, ZakatPaymentFormData } from '../types'

export const zakatKeys = {
  all: ['zakat'] as const,
  years: () => [...zakatKeys.all, 'years'] as const,
  yearList: (userId: string) => [...zakatKeys.years(), userId] as const,
  year: (userId: string, year: number) => [...zakatKeys.years(), userId, year] as const,
  payments: () => [...zakatKeys.all, 'payments'] as const,
  paymentList: (zakatYearId: string) => [...zakatKeys.payments(), zakatYearId] as const,
}

// ============================================
// ZAKAT YEARS
// ============================================

export function useZakatYears() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: zakatKeys.yearList(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('zakat_years')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: false })

      if (error) throw error
      return data as ZakatYear[]
    },
    enabled: !!user?.id,
  })
}

export function useZakatYear(year: number) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: zakatKeys.year(user?.id ?? '', year),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('zakat_years')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', year)
        .maybeSingle()

      if (error) throw error
      return data as ZakatYear | null
    },
    enabled: !!user?.id,
  })
}

export function useUpsertZakatYear() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (data: ZakatYearFormData) => {
      if (!user?.id) throw new Error('User not authenticated')

      // Check if exists
      const { data: existing } = await supabase
        .from('zakat_years')
        .select('id')
        .eq('user_id', user.id)
        .eq('year', data.year)
        .maybeSingle()

      if (existing) {
        const { data: updated, error } = await supabase
          .from('zakat_years')
          .update({
            gold_price_per_gram: data.gold_price_per_gram,
            calculation_month: data.calculation_month,
            payoneer_balance: data.payoneer_balance ?? 0,
            paypal_balance: data.paypal_balance ?? 0,
            exchange_rate: data.exchange_rate ?? 123,
            notes: data.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return updated as ZakatYear
      } else {
        const { data: created, error } = await supabase
          .from('zakat_years')
          .insert({
            user_id: user.id,
            year: data.year,
            gold_price_per_gram: data.gold_price_per_gram,
            calculation_month: data.calculation_month,
            payoneer_balance: data.payoneer_balance ?? 0,
            paypal_balance: data.paypal_balance ?? 0,
            exchange_rate: data.exchange_rate ?? 123,
            notes: data.notes || null,
          })
          .select()
          .single()

        if (error) throw error
        return created as ZakatYear
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zakatKeys.years() })
    },
  })
}

export function useDeleteZakatYear() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('zakat_years')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zakatKeys.years() })
      queryClient.invalidateQueries({ queryKey: zakatKeys.payments() })
    },
  })
}

// ============================================
// ZAKAT PAYMENTS
// ============================================

export function useZakatPayments(zakatYearId: string | undefined) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: zakatKeys.paymentList(zakatYearId ?? ''),
    queryFn: async () => {
      if (!user?.id || !zakatYearId) throw new Error('Missing required params')

      const { data, error } = await supabase
        .from('zakat_payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('zakat_year_id', zakatYearId)
        .order('payment_date', { ascending: false })

      if (error) throw error
      return data as ZakatPayment[]
    },
    enabled: !!user?.id && !!zakatYearId,
  })
}

export function useCreateZakatPayment() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (data: ZakatPaymentFormData) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data: payment, error } = await supabase
        .from('zakat_payments')
        .insert({
          user_id: user.id,
          zakat_year_id: data.zakat_year_id,
          amount: data.amount,
          payment_date: data.payment_date || null,
          note: data.note || null,
        })
        .select()
        .single()

      if (error) throw error
      return payment as ZakatPayment
    },
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: zakatKeys.paymentList(payment.zakat_year_id) })
    },
  })
}

export function useUpdateZakatPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ZakatPaymentFormData> }) => {
      const { data: payment, error } = await supabase
        .from('zakat_payments')
        .update({
          amount: data.amount,
          payment_date: data.payment_date || null,
          note: data.note || null,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return payment as ZakatPayment
    },
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: zakatKeys.paymentList(payment.zakat_year_id) })
    },
  })
}

export function useDeleteZakatPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, zakatYearId }: { id: string; zakatYearId: string }) => {
      const { error } = await supabase
        .from('zakat_payments')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, zakatYearId }
    },
    onSuccess: ({ zakatYearId }) => {
      queryClient.invalidateQueries({ queryKey: zakatKeys.paymentList(zakatYearId) })
    },
  })
}
