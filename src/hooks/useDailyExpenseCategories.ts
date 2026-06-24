import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { DailyExpenseCategoryRow, DailyExpenseCategoryFormData } from '../types'

export const dailyExpenseCategoryKeys = {
  all: ['dailyExpenseCategories'] as const,
  list: (userId: string) => [...dailyExpenseCategoryKeys.all, userId] as const,
}

/** User-managed category list (also editable by the Hermes agent via the DB). */
export function useDailyExpenseCategories() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: dailyExpenseCategoryKeys.list(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('daily_expense_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      return data as DailyExpenseCategoryRow[]
    },
    enabled: !!user?.id,
  })
}

export function useCreateDailyExpenseCategory() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (data: DailyExpenseCategoryFormData) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data: row, error } = await supabase
        .from('daily_expense_categories')
        .insert({
          user_id: user.id,
          name: data.name,
          color: data.color || '#6b7280',
          sort_order: data.sort_order ?? 500,
        })
        .select()
        .single()

      if (error) throw error
      return row as DailyExpenseCategoryRow
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyExpenseCategoryKeys.all })
    },
  })
}

export function useUpdateDailyExpenseCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DailyExpenseCategoryFormData }) => {
      const { data: row, error } = await supabase
        .from('daily_expense_categories')
        .update({
          name: data.name,
          color: data.color,
          sort_order: data.sort_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return row as DailyExpenseCategoryRow
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyExpenseCategoryKeys.all })
    },
  })
}

export function useDeleteDailyExpenseCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('daily_expense_categories').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyExpenseCategoryKeys.all })
    },
  })
}
