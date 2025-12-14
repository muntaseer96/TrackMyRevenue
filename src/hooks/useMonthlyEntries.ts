import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useYearStore } from '../stores/yearStore'
import type { MonthlyEntry } from '../types'

// Query keys
export const monthlyEntryKeys = {
  all: ['monthlyEntries'] as const,
  lists: () => [...monthlyEntryKeys.all, 'list'] as const,
  listByWebsiteMonth: (websiteId: string, year: number, month: number) =>
    [...monthlyEntryKeys.lists(), websiteId, year, month] as const,
  details: () => [...monthlyEntryKeys.all, 'detail'] as const,
  detail: (id: string) => [...monthlyEntryKeys.details(), id] as const,
}

// Fetch monthly entries for a specific website and month
export function useMonthlyEntriesByWebsite(websiteId: string | undefined, month: number) {
  const { selectedYear } = useYearStore()

  return useQuery({
    queryKey: monthlyEntryKeys.listByWebsiteMonth(websiteId ?? '', selectedYear, month),
    queryFn: async () => {
      if (!websiteId) throw new Error('Website ID required')

      const { data, error } = await supabase
        .from('monthly_entries')
        .select('*')
        .eq('website_id', websiteId)
        .eq('year', selectedYear)
        .eq('month', month)

      if (error) throw error
      return data as MonthlyEntry[]
    },
    enabled: !!websiteId && month >= 1 && month <= 12,
  })
}

// Upsert monthly entry (create or update)
export function useUpsertMonthlyEntry() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { selectedYear } = useYearStore()

  return useMutation({
    mutationFn: async ({
      websiteId,
      categoryId,
      month,
      amount,
    }: {
      websiteId: string
      categoryId: string
      month: number
      amount: number
    }) => {
      if (!user?.id) throw new Error('User not authenticated')

      // Check if entry already exists
      const { data: existing, error: fetchError } = await supabase
        .from('monthly_entries')
        .select('id')
        .eq('website_id', websiteId)
        .eq('category_id', categoryId)
        .eq('year', selectedYear)
        .eq('month', month)
        .maybeSingle()

      if (fetchError) throw fetchError

      if (existing) {
        // Update existing entry
        const { data, error } = await supabase
          .from('monthly_entries')
          .update({
            amount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return data as MonthlyEntry
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from('monthly_entries')
          .insert({
            user_id: user.id,
            website_id: websiteId,
            category_id: categoryId,
            year: selectedYear,
            month,
            amount,
          })
          .select()
          .single()

        if (error) throw error
        return data as MonthlyEntry
      }
    },
    onSuccess: (entry) => {
      // Invalidate the specific month's entries
      queryClient.invalidateQueries({
        queryKey: monthlyEntryKeys.listByWebsiteMonth(entry.website_id, entry.year, entry.month),
      })
    },
  })
}

// Delete monthly entry
export function useDeleteMonthlyEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      websiteId,
      year,
      month,
    }: {
      id: string
      websiteId: string
      year: number
      month: number
    }) => {
      const { error } = await supabase.from('monthly_entries').delete().eq('id', id)

      if (error) throw error
      return { id, websiteId, year, month }
    },
    onSuccess: ({ websiteId, year, month }) => {
      queryClient.invalidateQueries({
        queryKey: monthlyEntryKeys.listByWebsiteMonth(websiteId, year, month),
      })
    },
  })
}
